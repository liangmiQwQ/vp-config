import { listDependencies, readPackageJson } from '../manifest.ts'

export interface ManifestFacts {
  // Names of every dependency, including dev, peer and optional ones.
  packageDependencies: string[]
  packageExports: boolean
  packageBin: boolean
}

export function detectManifestFacts(directory: string): ManifestFacts {
  const packageJson = readPackageJson(directory)

  return {
    packageDependencies: listDependencies(packageJson),
    packageExports: packageJson?.exports !== undefined,
    packageBin: packageJson?.bin !== undefined
  }
}
