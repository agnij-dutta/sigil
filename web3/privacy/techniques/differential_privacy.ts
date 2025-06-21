export interface DifferentialPrivacyConfig {
  epsilon: number; // Privacy parameter
  delta?: number; // For (ε,δ)-differential privacy
  sensitivity: number; // Global sensitivity of the query
  mechanism: 'laplace' | 'gaussian' | 'exponential';
}

export interface PrivateQuery {
  queryType: 'count' | 'sum' | 'mean' | 'max' | 'histogram';
  data: number[];
  bins?: number; // For histogram queries
}

export class DifferentialPrivacyEngine {
  
  async applyPrivacy(
    query: PrivateQuery,
    config: DifferentialPrivacyConfig
  ): Promise<{ result: number | number[]; noiseAdded: number | number[] }> {
    
    switch (query.queryType) {
      case 'count':
        return this.privateCount(query.data, config);
      case 'sum':
        return this.privateSum(query.data, config);
      case 'mean':
        return this.privateMean(query.data, config);
      case 'max':
        return this.privateMax(query.data, config);
      case 'histogram':
        return this.privateHistogram(query.data, config, query.bins || 10);
      default:
        throw new Error(`Unsupported query type: ${query.queryType}`);
    }
  }

  private async privateCount(
    data: number[],
    config: DifferentialPrivacyConfig
  ): Promise<{ result: number; noiseAdded: number }> {
    const trueCount = data.length;
    const noise = this.generateNoise(config.mechanism, config.epsilon, config.sensitivity, config.delta);
    const noisyCount = Math.max(0, trueCount + noise);

    return {
      result: Math.round(noisyCount),
      noiseAdded: noise
    };
  }

  private async privateSum(
    data: number[],
    config: DifferentialPrivacyConfig
  ): Promise<{ result: number; noiseAdded: number }> {
    const trueSum = data.reduce((sum, value) => sum + value, 0);
    const noise = this.generateNoise(config.mechanism, config.epsilon, config.sensitivity, config.delta);
    const noisySum = trueSum + noise;

    return {
      result: noisySum,
      noiseAdded: noise
    };
  }

  private async privateMean(
    data: number[],
    config: DifferentialPrivacyConfig
  ): Promise<{ result: number; noiseAdded: number }> {
    if (data.length === 0) {
      return { result: 0, noiseAdded: 0 };
    }

    // For mean, we need to add noise to both sum and count
    const trueMean = data.reduce((sum, value) => sum + value, 0) / data.length;
    const noise = this.generateNoise(config.mechanism, config.epsilon / 2, config.sensitivity / data.length, config.delta);
    const noisyMean = trueMean + noise;

    return {
      result: noisyMean,
      noiseAdded: noise
    };
  }

  private async privateMax(
    data: number[],
    config: DifferentialPrivacyConfig
  ): Promise<{ result: number; noiseAdded: number }> {
    if (data.length === 0) {
      return { result: 0, noiseAdded: 0 };
    }

    // For max queries, we typically use the exponential mechanism
    const maxValue = Math.max(...data);
    
    if (config.mechanism === 'exponential') {
      // Simplified exponential mechanism
      const scores = data.map(value => Math.exp((config.epsilon * value) / (2 * config.sensitivity)));
      const totalScore = scores.reduce((sum, score) => sum + score, 0);
      const probabilities = scores.map(score => score / totalScore);
      
      // Sample according to probabilities (simplified)
      const random = Math.random();
      let cumulativeProb = 0;
      for (let i = 0; i < data.length; i++) {
        cumulativeProb += probabilities[i];
        if (random <= cumulativeProb) {
          return {
            result: data[i],
            noiseAdded: data[i] - maxValue
          };
        }
      }
    }

    // Fallback to adding noise to the true max
    const noise = this.generateNoise(config.mechanism, config.epsilon, config.sensitivity, config.delta);
    return {
      result: maxValue + noise,
      noiseAdded: noise
    };
  }

  private async privateHistogram(
    data: number[],
    config: DifferentialPrivacyConfig,
    bins: number
  ): Promise<{ result: number[]; noiseAdded: number[] }> {
    // Create histogram bins
    const minValue = Math.min(...data);
    const maxValue = Math.max(...data);
    const binWidth = (maxValue - minValue) / bins;
    
    const histogram = new Array(bins).fill(0);
    
    // Fill histogram
    data.forEach(value => {
      const binIndex = Math.min(Math.floor((value - minValue) / binWidth), bins - 1);
      histogram[binIndex]++;
    });

    // Add noise to each bin
    const noiseArray: number[] = [];
    const noisyHistogram = histogram.map(count => {
      const noise = this.generateNoise(config.mechanism, config.epsilon / bins, 1, config.delta);
      noiseArray.push(noise);
      return Math.max(0, count + noise);
    });

    return {
      result: noisyHistogram.map(count => Math.round(count)),
      noiseAdded: noiseArray
    };
  }

  private generateNoise(
    mechanism: string,
    epsilon: number,
    sensitivity: number,
    delta?: number
  ): number {
    switch (mechanism) {
      case 'laplace':
        return this.generateLaplaceNoise(sensitivity / epsilon);
      case 'gaussian':
        if (delta === undefined) {
          throw new Error('Delta parameter required for Gaussian mechanism');
        }
        return this.generateGaussianNoise(this.calculateGaussianSigma(epsilon, delta, sensitivity));
      case 'exponential':
        // For exponential mechanism, noise is handled differently
        return 0;
      default:
        throw new Error(`Unsupported noise mechanism: ${mechanism}`);
    }
  }

  private generateLaplaceNoise(scale: number): number {
    // Generate Laplace noise using inverse transform sampling
    const u = Math.random() - 0.5;
    return -scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
  }

  private generateGaussianNoise(sigma: number): number {
    // Box-Muller transform for Gaussian noise
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return z0 * sigma;
  }

  private calculateGaussianSigma(epsilon: number, delta: number, sensitivity: number): number {
    // Simplified calculation for Gaussian mechanism sigma
    const c = Math.sqrt(2 * Math.log(1.25 / delta));
    return (c * sensitivity) / epsilon;
  }

  // Utility methods for privacy budget management
  async compositionPrivacy(
    epsilons: number[],
    deltas?: number[]
  ): Promise<{ totalEpsilon: number; totalDelta?: number }> {
    // Basic composition - for advanced composition, more sophisticated bounds needed
    const totalEpsilon = epsilons.reduce((sum, eps) => sum + eps, 0);
    const totalDelta = deltas ? deltas.reduce((sum, delta) => sum + delta, 0) : undefined;

    return {
      totalEpsilon,
      totalDelta
    };
  }

  async estimatePrivacyLoss(
    queries: PrivateQuery[],
    configs: DifferentialPrivacyConfig[]
  ): Promise<{ totalEpsilon: number; totalDelta?: number; budgetExhausted: boolean }> {
    const epsilons = configs.map(config => config.epsilon);
    const deltas = configs.map(config => config.delta).filter(d => d !== undefined) as number[];

    const composition = await this.compositionPrivacy(epsilons, deltas.length > 0 ? deltas : undefined);

    return {
      totalEpsilon: composition.totalEpsilon,
      totalDelta: composition.totalDelta,
      budgetExhausted: composition.totalEpsilon > 1.0 // Common threshold
    };
  }

  // Utility for creating privacy-preserving aggregations
  async createPrivateAggregate(
    datasets: number[][],
    queryType: 'count' | 'sum' | 'mean',
    globalEpsilon: number,
    globalSensitivity: number
  ): Promise<{ results: number[]; totalPrivacyLoss: number }> {
    const epsilonPerDataset = globalEpsilon / datasets.length;
    const results: number[] = [];

    for (const dataset of datasets) {
      const config: DifferentialPrivacyConfig = {
        epsilon: epsilonPerDataset,
        sensitivity: globalSensitivity,
        mechanism: 'laplace'
      };

      const query: PrivateQuery = {
        queryType,
        data: dataset
      };

      const result = await this.applyPrivacy(query, config);
      results.push(Array.isArray(result.result) ? result.result[0] : result.result);
    }

    return {
      results,
      totalPrivacyLoss: globalEpsilon
    };
  }
} 