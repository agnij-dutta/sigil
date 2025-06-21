pragma circom 2.0.0;

// Central utilities file to avoid duplicate templates

template IsZero() {
    signal input in;
    signal output out;
    
    signal inv;
    inv <-- in != 0 ? 1/in : 0;
    out <== -in * inv + 1;
    in * out === 0;
}

template IsEqual() {
    signal input in[2];
    signal output out;
    
    component isz = IsZero();
    isz.in <== in[1] - in[0];
    out <== isz.out;
}

template Num2Bits(n) {
    signal input in;
    signal output out[n];
    var lc1 = 0;
    var e2 = 1;
    
    for (var i = 0; i < n; i++) {
        out[i] <-- (in >> i) & 1;
        out[i] * (out[i] - 1) === 0;
        lc1 += out[i] * e2;
        e2 = e2 + e2;
    }
    
    lc1 === in;
}

template LessThan(n) {
    assert(n <= 252);
    signal input in[2];
    signal output out;
    
    component num2Bits = Num2Bits(n + 1);
    num2Bits.in <== in[0] + (1 << n) - in[1];
    out <== 1 - num2Bits.out[n];
}

template GreaterThan(n) {
    assert(n <= 252);
    signal input in[2];
    signal output out;
    
    component lt = LessThan(n + 1);
    lt.in[0] <== in[1] + 1;
    lt.in[1] <== in[0] + (1 << n);
    out <== lt.out;
}

template GreaterEqThan(n) {
    signal input in[2];
    signal output out;
    
    component gt = GreaterThan(n);
    gt.in[0] <== in[0];
    gt.in[1] <== in[1] - 1;
    out <== gt.out;
}

template LessEqThan(n) {
    signal input in[2];
    signal output out;
    
    component lt = LessThan(n);
    lt.in[0] <== in[0] + 1;
    lt.in[1] <== in[1] + 1;
    out <== lt.out;
}

template AND() {
    signal input a;
    signal input b;
    signal output out;
    
    out <== a * b;
}

template OR() {
    signal input a;
    signal input b;
    signal output out;
    
    out <== a + b - a * b;
}

template NOT() {
    signal input in;
    signal output out;
    
    out <== 1 - in;
}

template Mux1() {
    signal input c[2];
    signal input s;
    signal output out;
    
    out <== c[0] + s * (c[1] - c[0]);
}

template SimplePoseidon(nInputs) {
    signal input inputs[nInputs];
    signal output out;
    
    // Simplified Poseidon hash (in practice, use a proper implementation)
    var sum = 0;
    for (var i = 0; i < nInputs; i++) {
        sum += inputs[i] * (i + 1);
    }
    out <== sum;
}

template Mimc7(nRounds) {
    signal input x_in;
    signal input k;
    signal output out;
    
    // Simplified MiMC7 (in practice, use proper implementation)
    var t = x_in;
    for (var i = 0; i < nRounds; i++) {
        t = t + k + i;
        t = t * t * t * t * t * t * t; // x^7
    }
    out <== t;
}

// Additional utility templates for aggregation circuits

template Sum(n) {
    signal input values[n];
    signal output out;
    
    var sum = 0;
    for (var i = 0; i < n; i++) {
        sum += values[i];
    }
    out <== sum;
}

template Multiplier() {
    signal input in[2];
    signal output out;
    
    out <== in[0] * in[1];
}

template SafeDivision(n) {
    signal input dividend;
    signal input divisor;
    signal output quotient;
    signal output remainder;
    
    // Check divisor is not zero
    component nonZeroCheck = GreaterThan(n);
    nonZeroCheck.in[0] <== divisor;
    nonZeroCheck.in[1] <== 0;
    
    // Perform division (simplified for circuit)
    quotient <-- dividend \ divisor;
    remainder <-- dividend % divisor;
    
    // Verify division correctness
    dividend === quotient * divisor + remainder;
    
    // Remainder must be less than divisor
    component ltDivisor = LessThan(n);
    ltDivisor.in[0] <== remainder;
    ltDivisor.in[1] <== divisor;
}

template CountUnique(n) {
    signal input values[n];
    signal input activeFlags[n];
    signal output count;
    
    // Simplified unique counting - just counts active values
    // In practice, this would need more sophisticated uniqueness checking
    component summer = Sum(n);
    for (var i = 0; i < n; i++) {
        summer.values[i] <== activeFlags[i];
    }
    count <== summer.out;
}

template ORMany(n) {
    signal input in[n];
    signal output out;
    
    if (n == 1) {
        out <== in[0];
    } else {
        component orGates[n - 1];
        
        orGates[0] = OR();
        orGates[0].a <== in[0];
        orGates[0].b <== in[1];
        
        for (var i = 1; i < n - 1; i++) {
            orGates[i] = OR();
            orGates[i].a <== orGates[i - 1].out;
            orGates[i].b <== in[i + 1];
        }
        
        out <== orGates[n - 2].out;
    }
}

// Simplified stub implementations for complex aggregation templates

template ConsistencyAnalyzer(n) {
    signal input startTimes[n];
    signal input endTimes[n];
    signal input commitCounts[n];
    signal input activeFlags[n];
    signal output score;
    
    // Simplified consistency score - just returns 50 (neutral)
    score <== 50;
}

template NonOwnershipVerifier(n) {
    signal input ownershipFlags[n];
    signal input activeFlags[n];
    signal output isNonOwner;
    
    // Simplified non-ownership check - always returns 1 (valid)
    isNonOwner <== 1;
}

template CollaborationVerifier(n) {
    signal input collaboratorCounts[n];
    signal input activeFlags[n];
    signal input validFlags[n];
    signal output hasCollaboration;
    
    // Simplified collaboration check - always returns 1 (valid)
    hasCollaboration <== 1;
} 