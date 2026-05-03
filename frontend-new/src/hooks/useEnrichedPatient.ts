/**
 * useEnrichedPatient — guarantees the PatientCard has full demographics.
 *
 * The chat endpoint sometimes returns a stripped Patient object (id +
 * conditions/meds/allergies but no name/age/sex/birthDate). The dedicated
 * `/api/v1/patients/{id}` endpoint always has full identity. This hook:
 *
 *   1. Pass-through if the input patient already has name + birthDate.
 *   2. Otherwise fetch the full record once per id, cache, merge into
 *      whatever the chat gave us (chat fields win for clinical data
 *      because they may be more recent — identity fields fill in).
 *
 * Avoids N+1 fetches by caching by id in module scope; switching back to
 * a previously-loaded patient is instant.
 */
import { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import type { Patient } from '../types';

const cache = new Map<string, Patient>();

function isComplete(p: Patient | null | undefined): boolean {
  if (!p) return false;
  return Boolean(
    p.name && String(p.name).trim() && p.birthDate && String(p.birthDate).trim(),
  );
}

export function useEnrichedPatient(stub: Patient | null): Patient | null {
  const [enriched, setEnriched] = useState<Patient | null>(stub);

  useEffect(() => {
    if (!stub) {
      setEnriched(null);
      return;
    }

    // Already complete — no fetch needed.
    if (isComplete(stub)) {
      setEnriched(stub);
      return;
    }

    // Cached enrichment for this id — merge chat stub on top so any
    // newer clinical data the chat returned wins over cached fields.
    const cached = cache.get(stub.id);
    if (cached) {
      setEnriched(mergePatients(cached, stub));
      return;
    }

    // Otherwise fetch the full record once.
    let cancelled = false;
    apiService
      .getPatientHistory(stub.id)
      .then((resp) => {
        if (cancelled) return;
        const data: any = resp?.data;
        const fullPatient: Patient | undefined = data?.patient;
        if (fullPatient) {
          cache.set(stub.id, fullPatient);
          setEnriched(mergePatients(fullPatient, stub));
        } else {
          setEnriched(stub);
        }
      })
      .catch((err) => {
        // Quiet failure — fall back to whatever the chat gave us. The
        // PatientCard has its own "Patient {id}" / "not on file"
        // fallbacks so the UI still renders cleanly.
        // eslint-disable-next-line no-console
        console.warn('[useEnrichedPatient] fetch failed', err);
        if (!cancelled) setEnriched(stub);
      });

    return () => {
      cancelled = true;
    };
    // Stub identity — shallow id check is enough to trigger refetch.
  }, [stub?.id]);

  return enriched;
}

/**
 * Merge two Patient objects: identity fields from `full`, clinical fields
 * preferring whichever side is non-empty (newer chat data wins for
 * conditions/meds/allergies, full record wins for demographics).
 */
function mergePatients(full: Patient, fresh: Patient | null): Patient {
  if (!fresh) return full;
  return {
    ...full,
    // Prefer fresh clinical lists if non-empty, else keep full.
    conditions: pickList(fresh.conditions, full.conditions),
    medications: pickList(fresh.medications, full.medications),
    allergies: pickList(fresh.allergies, full.allergies),
    // Identity always from full — that's the whole point of fetching.
    name: full.name ?? fresh.name,
    birthDate: full.birthDate || fresh.birthDate,
    age: full.age ?? fresh.age,
    gender: full.gender || fresh.gender,
    address: full.address ?? fresh.address,
    telecom: full.telecom ?? fresh.telecom,
    id: fresh.id || full.id,
  };
}

function pickList<T>(a: T[] | undefined, b: T[] | undefined): T[] | undefined {
  if (a && a.length > 0) return a;
  if (b && b.length > 0) return b;
  return a ?? b;
}
