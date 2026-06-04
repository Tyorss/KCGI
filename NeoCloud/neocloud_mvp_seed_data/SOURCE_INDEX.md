# Neocloud MVP seed data source index

Updated: 2026-06-03

This seed dataset is intended for an MVP dashboard. It mixes official company releases, SEC exhibits, Reuters/AP reporting, and company product pages. Coordinates are usually city-level or county-level because exact data center parcels are often not publicly disclosed. Validate all financial, GPU, power, contract, and location data before investment use.

## Main records

| Area | Records | Primary source URL |
|---|---|---|
| IREN Childress / Microsoft | `iren_childress_microsoft_gb300`, `contract_iren_microsoft_gb300_2025` | https://iren.com/resources/blog/iren-signs97-billion-agreement-with-microsoft-to-deploy-ai-cloud-infrastructure |
| Nebius Vineland / Microsoft | `nebius_vineland_microsoft_ai_infra`, `contract_nebius_microsoft_2025` | https://nebius.com/newsroom/nebius-announces-multi-billion-dollar-agreement-with-microsoft-for-ai-infrastructure |
| Nebius New Jersey / Iceland / hardware pages | `nebius_keflavik_iceland_colocation`, `nebius_kansas_city_patmos_colocation`, `nebius_longcross_uk_blackwell_ultra` | https://nebius.com/hardware |
| Nebius / Meta | `contract_nebius_meta_vera_rubin_2026` | https://nebius.com/newsroom/nebius-signs-new-ai-infrastructure-agreement-with-meta |
| NVIDIA / Nebius 5GW partnership | context only | https://nvidianews.nvidia.com/news/nvidia-and-nebius-partner-to-scale-full-stack-ai-cloud |
| CoreWeave Lancaster PA | `coreweave_lancaster_pa_ai_infra` | https://investors.coreweave.com/news/news-details/2025/CoreWeave-Announces-Multi-Billion-Dollar-Commitment-to-AI-Infrastructure-in-Pennsylvania/default.aspx |
| Applied Digital Ellendale / CoreWeave | `applied_digital_ellendale_coreweave`, `contract_applied_digital_coreweave_ellendale_2025` | https://ir.applieddigital.com/news-events/press-releases/detail/123/applied-digital-announces-250mw-ai-data-center-lease-with |
| TeraWulf Lake Mariner / Fluidstack / Google | `terawulf_lake_mariner_fluidstack_google`, `contract_terawulf_fluidstack_google_2025` | https://investors.terawulf.com/news-events/press-releases/detail/112/terawulf-signs-200-mw-10-year-ai-hosting-agreements-with-fluidstack |
| Cipher Barber Lake / Fluidstack / Google | `cipher_barber_lake_fluidstack_google`, `contract_cipher_fluidstack_google_2025` | https://www.sec.gov/Archives/edgar/data/1819989/000095010325015073/dp237633_ex9901.htm |
| Crusoe Abilene / Oracle / OpenAI | `crusoe_abilene_oracle_openai_stargate` | https://www.crusoe.ai/resources/newsroom/crusoe-expands-ai-data-center-campus-in-abilene-to-1-2-gigawatts |
| Crusoe / Microsoft Abilene expansion | `crusoe_abilene_microsoft_ai_factory_power` | https://apnews.com/article/ai-stargate-microsoft-openai-crusoe-oracle-f4f74c3a4617d8cfab5b933fc31ccc6e |
| Lambda Kansas City | `lambda_kansas_city_100mw_ai_factory` | https://lambda.ai/blog/lambda-to-build-a-100mw-ai-factory-in-kansas-city-mo |
| Lambda / Prime LAX01 Vernon | `lambda_prime_lax01_vernon` | https://www.prnewswire.com/news-releases/prime-data-centers-and-lambda-partner-to-power-the-next-era-of-superintelligence-with-ai-optimized-infrastructure-in-southern-california-302613971.html |
| Lambda / ECL Mountain View | `lambda_ecl_mountain_view_mv1_gb300` | https://www.businesswire.com/news/home/20250923779565/en/Lambda-and-ECL-Bring-the-First-Hydrogen-Powered-NVIDIA-GB300-NVL72-Systems-Online |
| Lambda / Aligned DFW-04 Plano | `lambda_aligned_dfw04_plano` | https://aligneddc.com/press-release/aligned-and-lambda-partner-to-power-next-generation-ai-infrastructure-6/ |
| Lambda / HRT | `lambda_hrt_blackwell_cloud_deal`, `contract_lambda_hrt_blackwell_2026` | https://www.reuters.com/legal/transactional/lamda-wins-cloud-deal-with-hudson-river-trading-supply-access-nvidia-chips-2026-05-20/ |
| Hut 8 River Bend / Anthropic / Fluidstack | `hut8_river_bend_anthropic_fluidstack`, `contract_hut8_river_bend_anthropic_fluidstack_2025` | https://www.prnewswire.com/news-releases/hut-8-announces-ai-infrastructure-partnership-with-anthropic-and-fluidstack-302644377.html |
| Hut 8 Beacon Point | `hut8_beacon_point_nueces_confidential`, `contract_hut8_beacon_point_confidential_2026` | https://www.prnewswire.com/news-releases/hut-8-commercializes-first-phase-of-1-gw-beacon-point-ai-data-center-campus-with-15-year-352-mw-it-lease-with-base-term-contract-value-of-9-8-billion-302763484.html |
| Core Scientific Austin / CoreWeave | `core_scientific_austin_coreweave_16mw`, `contract_core_scientific_coreweave_austin_2024` | https://investors.corescientific.com/news-events/press-releases/detail/9/core-scientific-to-provide-coreweave-up-to-16-mw-of-data-center-infrastructure-to-support-ai-and-hpc-workloads-in-long-term-hosting-contract-with-potential-revenue-of-more-than-100-million |
| Core Scientific multi-site / CoreWeave | `core_scientific_multi_site_coreweave_270mw`, `contract_core_scientific_coreweave_multisite_2024` | https://investors.corescientific.com/news-events/press-releases/detail/78/core-scientific-announces-new-contract-with-coreweave-for-delivery-of-approximately-70-mw-of-additional-infrastructure-to-host-high-performance-computing-operations |

## Implementation notes

- Treat `latitude` and `longitude` as display coordinates, not verified parcel-level coordinates, unless `locationAccuracy` is `exact_site`.
- Do not plot rows where latitude/longitude are missing.
- `powerMwPlanned` can mean site/campus potential capacity, while `powerMwSecured` usually means contracted/critical IT load. Read `notes` before comparing across companies.
- `contractValueUsd` is normalized to USD where available. Some contracts are base-term only; option/renewal values are in `potentialValueUsd` in `contracts.json`.
- Rows with Reuters/AP as the only source should be verified against company filings when possible.
