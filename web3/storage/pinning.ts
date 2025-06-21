/**
 * IPFS Pinning Service for Sigil
 * Manages pinning across multiple providers for redundancy
 */

import { CID } from 'multiformats/cid'
import {
  PinningServiceConfig,
  StorageError,
  StorageErrorCode,
  RedundancyStatus
} from './types'

export interface PinStatus {
  cid: string
  status: 'pinned' | 'pinning' | 'failed'
  service: string
  timestamp: number
  error?: string
}

export interface PinningResult {
  success: boolean
  results: PinStatus[]
  redundancyLevel: number
}

export class PinningService {
  private services: PinningServiceConfig[]
  private pinCache = new Map<string, PinStatus[]>()

  constructor(services: PinningServiceConfig[]) {
    this.services = services.filter(s => s.enabled).sort((a, b) => b.priority - a.priority)
  }

  /**
   * Pin content to IPFS with redundancy
   */
  async pin(cid: CID, redundancyLevel: number = 2): Promise<PinningResult> {
    const cidStr = cid.toString()
    
    try {
      const servicesToUse = this.services.slice(0, redundancyLevel)
      if (servicesToUse.length === 0) {
        throw new StorageError(
          'No pinning services available',
          StorageErrorCode.INSUFFICIENT_REDUNDANCY
        )
      }

      console.log(`Pinning ${cidStr} to ${servicesToUse.length} services`)

      const pinPromises = servicesToUse.map(service => 
        this.pinToService(cid, service)
      )

      const results = await Promise.allSettled(pinPromises)
      const pinResults: PinStatus[] = []
      let successCount = 0

      results.forEach((result, index) => {
        const service = servicesToUse[index]
        if (result.status === 'fulfilled') {
          pinResults.push(result.value)
          if (result.value.status === 'pinned') {
            successCount++
          }
        } else {
          pinResults.push({
            cid: cidStr,
            status: 'failed',
            service: service.name,
            timestamp: Date.now(),
            error: result.reason?.message || 'Unknown error'
          })
        }
      })

      // Cache the results
      this.pinCache.set(cidStr, pinResults)

      // Consider successful if at least one pin succeeded
      const success = successCount > 0

      if (!success) {
        throw new StorageError(
          `Failed to pin content to any service`,
          StorageErrorCode.INSUFFICIENT_REDUNDANCY,
          { cid: cidStr, results: pinResults }
        )
      }

      console.log(`Successfully pinned ${cidStr} to ${successCount}/${servicesToUse.length} services`)

      return {
        success,
        results: pinResults,
        redundancyLevel: successCount
      }

    } catch (error) {
      if (error instanceof StorageError) {
        throw error
      }
      throw new StorageError(
        'Pinning operation failed',
        StorageErrorCode.INSUFFICIENT_REDUNDANCY,
        { cid: cidStr, error }
      )
    }
  }

  /**
   * Unpin content from all services
   */
  async unpin(cid: CID): Promise<PinningResult> {
    const cidStr = cid.toString()

    try {
      const unpinPromises = this.services.map(service =>
        this.unpinFromService(cid, service)
      )

      const results = await Promise.allSettled(unpinPromises)
      const unpinResults: PinStatus[] = []
      let successCount = 0

      results.forEach((result, index) => {
        const service = this.services[index]
        if (result.status === 'fulfilled') {
          unpinResults.push(result.value)
          successCount++
        } else {
          unpinResults.push({
            cid: cidStr,
            status: 'failed',
            service: service.name,
            timestamp: Date.now(),
            error: result.reason?.message || 'Unknown error'
          })
        }
      })

      // Remove from cache
      this.pinCache.delete(cidStr)

      return {
        success: successCount > 0,
        results: unpinResults,
        redundancyLevel: 0
      }

    } catch (error) {
      throw new StorageError(
        'Unpinning operation failed',
        StorageErrorCode.CONNECTION_FAILED,
        { cid: cidStr, error }
      )
    }
  }

  /**
   * Check pin status across all services
   */
  async checkPinStatus(cid: CID): Promise<PinStatus[]> {
    const cidStr = cid.toString()

    // Check cache first
    const cached = this.pinCache.get(cidStr)
    if (cached) {
      const cacheAge = Date.now() - Math.max(...cached.map(p => p.timestamp))
      if (cacheAge < 300000) { // 5 minutes cache
        return cached
      }
    }

    try {
      const statusPromises = this.services.map(service =>
        this.checkServicePinStatus(cid, service)
      )

      const results = await Promise.allSettled(statusPromises)
      const statusResults: PinStatus[] = []

      results.forEach((result, index) => {
        const service = this.services[index]
        if (result.status === 'fulfilled') {
          statusResults.push(result.value)
        } else {
          statusResults.push({
            cid: cidStr,
            status: 'failed',
            service: service.name,
            timestamp: Date.now(),
            error: result.reason?.message || 'Status check failed'
          })
        }
      })

      // Update cache
      this.pinCache.set(cidStr, statusResults)

      return statusResults

    } catch (error) {
      throw new StorageError(
        'Pin status check failed',
        StorageErrorCode.CONNECTION_FAILED,
        { cid: cidStr, error }
      )
    }
  }

  /**
   * Get redundancy health status
   */
  async getRedundancyHealth(): Promise<RedundancyStatus> {
    const totalNodes = this.services.length
    let availableNodes = 0

    // Check each service health
    const healthChecks = await Promise.allSettled(
      this.services.map(service => this.checkServiceHealth(service))
    )

    healthChecks.forEach(result => {
      if (result.status === 'fulfilled' && result.value) {
        availableNodes++
      }
    })

    let replicationHealth: 'healthy' | 'degraded' | 'critical'
    const healthRatio = availableNodes / totalNodes

    if (healthRatio >= 0.8) {
      replicationHealth = 'healthy'
    } else if (healthRatio >= 0.5) {
      replicationHealth = 'degraded'
    } else {
      replicationHealth = 'critical'
    }

    return {
      totalNodes,
      availableNodes,
      replicationHealth,
      lastVerified: Date.now()
    }
  }

  /**
   * Repair pinning by re-pinning to failed services
   */
  async repairPinning(cid: CID, targetRedundancy: number = 2): Promise<PinningResult> {
    const currentStatus = await this.checkPinStatus(cid)
    const pinnedCount = currentStatus.filter(s => s.status === 'pinned').length

    if (pinnedCount >= targetRedundancy) {
      return {
        success: true,
        results: currentStatus,
        redundancyLevel: pinnedCount
      }
    }

    // Find services that need repair
    const failedServices = this.services.filter(service => {
      const status = currentStatus.find(s => s.service === service.name)
      return !status || status.status !== 'pinned'
    })

    const servicesToRepair = failedServices.slice(0, targetRedundancy - pinnedCount)

    if (servicesToRepair.length === 0) {
      throw new StorageError(
        'No services available for repair',
        StorageErrorCode.INSUFFICIENT_REDUNDANCY
      )
    }

    // Attempt to pin to failed services
    const repairPromises = servicesToRepair.map(service =>
      this.pinToService(cid, service)
    )

    const repairResults = await Promise.allSettled(repairPromises)
    const newResults: PinStatus[] = [...currentStatus]
    let newSuccessCount = pinnedCount

    repairResults.forEach((result, index) => {
      const service = servicesToRepair[index]
      if (result.status === 'fulfilled') {
        const existingIndex = newResults.findIndex(r => r.service === service.name)
        if (existingIndex >= 0) {
          newResults[existingIndex] = result.value
        } else {
          newResults.push(result.value)
        }
        if (result.value.status === 'pinned') {
          newSuccessCount++
        }
      }
    })

    return {
      success: newSuccessCount >= targetRedundancy,
      results: newResults,
      redundancyLevel: newSuccessCount
    }
  }

  // Private helper methods

  private async pinToService(cid: CID, service: PinningServiceConfig): Promise<PinStatus> {
    try {
      console.log(`Pinning ${cid.toString()} to ${service.name}`)

      const response = await fetch(`${service.endpoint}/pins`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${service.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cid: cid.toString(),
          name: `sigil-${Date.now()}`,
          meta: {
            service: 'sigil',
            type: 'credential'
          }
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()

      return {
        cid: cid.toString(),
        status: result.status === 'pinned' ? 'pinned' : 'pinning',
        service: service.name,
        timestamp: Date.now()
      }

    } catch (error) {
      console.error(`Failed to pin to ${service.name}:`, error)
      return {
        cid: cid.toString(),
        status: 'failed',
        service: service.name,
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  private async unpinFromService(cid: CID, service: PinningServiceConfig): Promise<PinStatus> {
    try {
      const response = await fetch(`${service.endpoint}/pins/${cid.toString()}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${service.accessToken}`
        }
      })

      if (!response.ok && response.status !== 404) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return {
        cid: cid.toString(),
        status: 'pinned', // Status after unpinning (not pinned anymore)
        service: service.name,
        timestamp: Date.now()
      }

    } catch (error) {
      return {
        cid: cid.toString(),
        status: 'failed',
        service: service.name,
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  private async checkServicePinStatus(cid: CID, service: PinningServiceConfig): Promise<PinStatus> {
    try {
      const response = await fetch(`${service.endpoint}/pins/${cid.toString()}`, {
        headers: {
          'Authorization': `Bearer ${service.accessToken}`
        }
      })

      if (response.status === 404) {
        return {
          cid: cid.toString(),
          status: 'failed',
          service: service.name,
          timestamp: Date.now(),
          error: 'Not pinned'
        }
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()

      return {
        cid: cid.toString(),
        status: result.status || 'pinned',
        service: service.name,
        timestamp: Date.now()
      }

    } catch (error) {
      return {
        cid: cid.toString(),
        status: 'failed',
        service: service.name,
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  private async checkServiceHealth(service: PinningServiceConfig): Promise<boolean> {
    try {
      const response = await fetch(`${service.endpoint}/pins?limit=1`, {
        headers: {
          'Authorization': `Bearer ${service.accessToken}`
        }
      })

      return response.ok

    } catch (error) {
      console.error(`Health check failed for ${service.name}:`, error)
      return false
    }
  }

  /**
   * Get pinning statistics
   */
  getStats(): {
    totalServices: number
    enabledServices: number
    cachedPins: number
  } {
    return {
      totalServices: this.services.length + this.services.filter(s => !s.enabled).length,
      enabledServices: this.services.length,
      cachedPins: this.pinCache.size
    }
  }

  /**
   * Clear pin cache
   */
  clearCache(): void {
    this.pinCache.clear()
  }
} 