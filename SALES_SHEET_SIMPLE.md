---
title: SynaptixSchedule
subtitle: A simple tool for the medical assistants doing the hardest work.
date: May 2026
---

# SynaptixSchedule

## What is it?

Most clinics still run their day on a phone, a paper schedule, and the medical assistant's memory. When a patient walks in with chest pain at 9:15, the MA flips through a binder, calls the front desk, then types the same patient ID into three different systems before anyone gets seen.

SynaptixSchedule replaces that whole dance with one screen. The MA pulls up the patient, types what's going on in plain English, and the screen shows the urgency, the labs to order, and the next available appointment with the right doctor — usually in under a minute.

It plugs into the EHR you already have through FHIR, so nobody has to re-enter anything. It runs in a browser. There's no on-prem server.

## What it feels like to use

Sarah's an MA at a cardiology clinic. She used to start the morning printing the day's schedule, taping it to her station, and re-checking it every time a patient called to reschedule.

Now she opens her tab and the day's appointments are right there above her chat — color-coded by urgency, the emergencies always at the top. When a patient ID hits her chat, the screen fills with everything she needs: the patient's name, allergies, current meds, recent conditions, all on one line. She types "chest pain, came in this morning, looks pale and short of breath" — and the system flags it as an emergency, lists the three labs she should order right now (ECG, Troponin, BNP), and shows her three doctors who can see this patient today, ranked best-fit first. One tap and it's booked. Confirmation number on screen.

She doesn't fill out any forms. She doesn't memorize protocol cards. The system caught the red flags before she did.

## Why it's worth paying for

A single MA spends roughly an hour and a half a day on the parts of the job that this tool just does. For a clinic with 50 MAs, that's about $1.5 million a year in time you're not paying for anymore.

On top of that, no-shows drop because the MA actually has time to call the next patient on the list before they reschedule. Insurance claims get paid more often because the right tests were ordered the first time. Emergencies get caught earlier. Lawsuits from missed heart attacks don't happen as often.

A typical 50-MA clinic gets back roughly **$2 million a year**. The tool costs around **$120,000 a year** at that size. The math takes about three weeks to pay you back.

## What it runs on

React on the front end, FastAPI on the back end, an LLM (Llama 4) for the language understanding, FHIR R4 for the EHR connection, and Postgres for the application data. Everything sits on Google Cloud Run, which scales itself and charges by the second of actual use. A small clinic typically pays under $500 a month for hosting.

## What you'll see in a demo

We'll walk you through five real test patients across five specialties — cardiology, primary care, orthopedics, pulmonology, endocrinology. You'll watch a chest pain protocol activate in real time, see the labs ordered, watch a slot get booked against a real FHIR server, and get the confirmation number on screen. The whole demo runs about fifteen minutes.

If you want to try it on your own data, we can stand up a sandbox in a couple of days with your facility, your specialties, and a handful of synthetic patients. No PHI, no commitment.

---

*If this sounds like something you'd want for your team, send a note.*
*— The SynaptixSchedule team*
