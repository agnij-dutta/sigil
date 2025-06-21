import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export async function GET(): Promise<NextResponse> {
  try {
    const buildPath = path.join(process.cwd(), 'build', 'circuits');
    const compiledPath = path.join(buildPath, 'compiled');
    const zkeysPath = path.join(buildPath, 'zkeys');

    // Check if build directory exists
    const buildExists = fs.existsSync(buildPath);
    const compiledExists = fs.existsSync(compiledPath);
    const zkeysExists = fs.existsSync(zkeysPath);

    // Get list of compiled circuits
    const compiledCircuits: string[] = [];
    if (compiledExists) {
      compiledCircuits.push(...fs.readdirSync(compiledPath).filter(item => 
        fs.statSync(path.join(compiledPath, item)).isDirectory()
      ));
    }

    // Get list of zkey files
    const zkeyFiles: string[] = [];
    if (zkeysExists) {
      zkeyFiles.push(...fs.readdirSync(zkeysPath).filter(file => file.endsWith('.zkey')));
    }

    // Test a simple circuit (repository_credential) if available
    let testResult = null;
    const testCircuit = 'repository_credential';
    const wasmPath = path.join(compiledPath, testCircuit, `${testCircuit}_js`, `${testCircuit}.wasm`);
    const zkeyPath = path.join(zkeysPath, `${testCircuit}.zkey`);

    if (fs.existsSync(wasmPath) && fs.existsSync(zkeyPath)) {
      testResult = {
        circuit: testCircuit,
        wasmExists: true,
        zkeyExists: true,
        wasmSize: fs.statSync(wasmPath).size,
        zkeySize: fs.statSync(zkeyPath).size,
        status: 'ready'
      };
    } else {
      testResult = {
        circuit: testCircuit,
        wasmExists: fs.existsSync(wasmPath),
        zkeyExists: fs.existsSync(zkeyPath),
        status: 'not_ready'
      };
    }

    return NextResponse.json({
      message: 'Snark API Test Results',
      setup: {
        buildDirectoryExists: buildExists,
        compiledDirectoryExists: compiledExists,
        zkeysDirectoryExists: zkeysExists
      },
      circuits: {
        compiled: compiledCircuits,
        totalCompiled: compiledCircuits.length,
        zkeyFiles: zkeyFiles.map(f => f.replace('.zkey', '')),
        totalZkeys: zkeyFiles.length
      },
      testCircuit: testResult,
      paths: {
        buildPath,
        compiledPath,
        zkeysPath
      },
      recommendations: buildExists ? [] : [
        'Run circuit compilation: npm run circuits:compile',
        'Run trusted setup: npm run circuits:setup',
        'Verify circuit files exist in build/circuits/'
      ]
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Test failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
} 