# LitLens evaluation results

_Generated 2026-11-22 07:08 UTC from `eval/topics.yaml` (10 topics, 10 completed). Indexing excluded._

## Summary

6 of 10 completed runs were fresh (not served from the cache); quality metrics use all runs, time and token means use fresh runs only.

| Metric | Mean |
|---|---|
| Papers selected | 8.0 |
| Review time (s), fresh runs | 53.0 |
| Tokens per run, fresh runs | 6310.5 |
| Citation validity (%) | 100.0 |
| Weakly supported claims (%) | 20.3 |
| Extraction completeness (%) | 62.3 |

## Per topic

| Topic | Status | Papers | Time (s) | Tokens 20b / 120b | Citations valid % | Weak % | Uncited | Completeness % | Human relevance (1-5) |
|---|---|---|---|---|---|---|---|---|---|
| graph neural networks for drug discovery | done | 8/25 | 1.1 | 0 / 0 | 100.0 | 11.1 | 4 | 58.3 | |
| federated learning privacy attacks | done | 8/25 | 1.4 | 0 / 0 | 100.0 | 30.0 | 3 | 60.4 | |
| retrieval-augmented generation for question answering | done | 8/21 | 2.3 | 0 / 0 | 100.0 | 28.6 | 3 | 64.6 | |
| crop disease detection using deep learning | done | 8/25 | 1.1 | 0 / 0 | 100.0 | 0.0 | 9 | 66.7 | |
| zero-knowledge proofs for blockchain scalability | done | 8/17 | 17.0 | 4099 / 2272 | 100.0 | 22.2 | 5 | 68.8 | |
| reinforcement learning for robot manipulation | done | 8/25 | 60.2 | 3942 / 2222 | 100.0 | 9.1 | 3 | 58.3 | |
| code generation with large language models | done | 8/25 | 61.2 | 4190 / 2313 | 100.0 | 22.2 | 5 | 62.5 | |
| energy-efficient task scheduling in edge computing | done | 8/17 | 58.7 | 3914 / 2167 | 100.0 | 10.0 | 5 | 56.2 | |
| explainable AI for medical image diagnosis | done | 8/25 | 60.4 | 3908 / 2286 | 100.0 | 33.3 | 2 | 62.5 | |
| adversarial attacks on autonomous driving perception | done | 8/25 | 60.3 | 4301 / 2249 | 100.0 | 36.4 | 2 | 64.6 | |

## Stage latencies (s)

| Topic | planning | searching | ranking | extracting | synthesizing | verifying |
|---|---|---|---|---|---|---|
| graph neural networks for drug discovery | 0.0 | 0.0 | 0.6 | 0.0 | 0.0 | 0.5 |
| federated learning privacy attacks | 0.0 | 0.0 | 0.7 | 0.0 | 0.0 | 0.7 |
| retrieval-augmented generation for question answering | 0.0 | 0.0 | 0.5 | 0.0 | 0.0 | 1.7 |
| crop disease detection using deep learning | 0.0 | 0.0 | 0.8 | 0.0 | 0.0 | 0.3 |
| zero-knowledge proofs for blockchain scalability | 0.6 | 11.3 | 0.4 | 1.7 | 2.3 | 0.6 |
| reinforcement learning for robot manipulation | 0.4 | 9.2 | 0.6 | 47.0 | 2.3 | 0.7 |
| code generation with large language models | 0.4 | 8.5 | 0.6 | 47.9 | 3.4 | 0.4 |
| energy-efficient task scheduling in edge computing | 0.2 | 8.8 | 0.4 | 46.6 | 2.1 | 0.6 |
| explainable AI for medical image diagnosis | 0.5 | 8.0 | 0.6 | 48.4 | 2.3 | 0.7 |
| adversarial attacks on autonomous driving perception | 0.4 | 9.1 | 0.6 | 47.4 | 2.2 | 0.6 |

## How metrics are computed

- **Citation validity**: valid `[n]` markers / all markers, before invalid ones are removed.
- **Weakly supported claims**: distinct cited sentences whose embedding similarity to the cited paper (abstract or extracted facts) is below `SUPPORT_THRESHOLD`, as a share of all cited sentences.
- **Extraction completeness**: share of the 6 extracted fields per paper that are not "Not reported" (datasets/metrics: non-empty).
- **Human relevance**: score each review 1-5 by hand (how relevant are the selected papers to the topic?).
- Times exclude background PDF indexing. A cached re-run reports 0 tokens.
- Topics run back to back, so later fresh runs wait for Groq's 8K tokens-per-minute limit (visible as long `extracting` times). A single run, as in a live demo, does not.
