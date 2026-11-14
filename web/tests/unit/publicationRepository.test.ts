import { describe, expect, it } from 'vitest'
import { demoStations } from '../../src/data/publicationRepository'

// RN-04: los ejemplos en memoria nunca se presentan como resultados reales.
// RN-13: una ausencia se declara «no reportada» con motivo, nunca como cifra.
describe('in-memory example stations', () => {
  it('labels every in-memory station as DEMO', () => {
    for (const station of Object.values(demoStations)) {
      expect(station.evidenceMode, station.stationId).toBe('DEMO')
    }
  })

  it('does not carry figures without a published source', () => {
    for (const station of Object.values(demoStations)) {
      expect(station.area.value, station.stationId).toBeNull()
      expect(station.area.status, station.stationId).toBe('not-reported')
      expect(station.area.reason, station.stationId).toBeTruthy()
    }
  })
})
