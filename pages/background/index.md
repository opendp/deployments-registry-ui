---
layout: docs
title: Background
class: background
permalink: /background/
icon: 'fa-book'
---

Over the last five years, the use of differential privacy as an output disclosure control for sensitive data releases and queries has grown substantially. This is due in part to the elegant and theoretically robust underpinning of the differential privacy literature, in part to the prevalence of attacks on traditional disclosure techniques, and in part to the adoption of differential privacy by those perceived to set the "gold standard" such as the US Census ([22][22], [23][23]) which acts as a form of social proof, giving greater confidence to other early adopters.

As a reference, one way to classify the maturity and readiness of a technology in industry is to consider the technology readiness level of the technology ([24][24]). Systems built with differential privacy guarantees can be found between TRL 6-9. In other words, some industry applications of differential privacy have only been demonstrated in relevant domains, while others have been deployed and tested in operational environments. As such, finding common ground on privacy deployments appears to be an urgent challenge for the DP industry.

The purpose of this document is to support the responsible adoption of differential privacy in the industry. Differential privacy, as will be introduced in an upcoming section, is simply a measure of information loss about data subjects or entities. However, there are few guidelines or recommendations for choosing the thresholds of what a reasonable balance between privacy and query accuracy should be. Furthermore, in many scenarios, these thresholds are context-specific and thus, any organization endeavoring to adopt differential privacy in practice will find its selection extremely important.

In this document, we describe some dimensions with which we can describe applications of differential privacy and label many real-world case studies based on the setting they are deployed in and the privacy budgets chosen. While this is not intended to act as an endorsement of any application, we hope that the document will act as a baseline for informed debate, precedence and eventually, best practices to emerge.

Core to this document, is a registry of case studies present at the end. Much of the work of identifying these initial case studies is due to the great prior work from personal blogs ([25][25]), government and NGO guides ([26][26], [27][27]). Despite pre-existing work, the motivation of this document lies on expanding expand the number and classification of these case studies in an open-source fashion, such that the community as a whole can contribute and shape a shared understanding.

On the other hand, if the reader is interested more in an introduction to differential privacy, there are some excellent resources available such as books/papers ([28][28], [29][29]), online lecture notes and websites ([32]). While this document introduces some of the nomenclature of differential privacy, it is not intended to be a standalone resource and will refer to common techniques and mechanisms with only references where the reader can learn more.

Finally, and importantly, this document is not intended to be static in nature. One core purpose behind the document is to periodically add new case studies, to keep up with the ever evolving practices of industry and government applications and align with guidance from regulators which are expected to be more prevalent in coming years. If you would like to join the authors of this document and support the registry, please head over to the [Github page](https://github.com/opendp/deployments-registry-ui).

[22]: https://lehd.ces.census.gov/data/pseo_experimental.html "U.S.C. Bureau: Post-Secondary Employment Outcomes"
[23]: https://www.census.gov/newsroom/press-releases/2021/2020-census-key-parameters.html "U.S.C. Bureau: Restricting Demographic Information"
[24]: https://ec.europa.eu/research/participants/data/ref/h2020/wp/2014_2015/annexes/h2020-wp1415-annex-g-trl_en.pdf "Horizon 2020 - Work Programme 2014-2015: General Annexes. Extract from Part 19 - Commission Decision C(2014)4995"
[25]: https://desfontain.es/blog/real-world-differential-privacy.html "D. Desfontaines: A list of real-world uses of differential privacy"
[26]: https://cdeiuk.github.io/pets-adoption-guide/repository/ "Centre for Data Ethics and Innovation (CDEI): Privacy Enhancing Technologies Adoption Guide"
[27]: https://unstats.un.org/bigdata/task-teams/privacy/guide/ "United Nations, Department of Economic and Social Affairs, Statistics Division: UN Guide on Privacy-Enhancing Technologies for Official Statistics"
[28]: http://arxiv.org/pdf/2005.00010.pdf "G. Kamath, J. Ullman: A Primer on Private Statistics"
[29]: https://programming-dp.com/ "J.P. Near, C. Abuah: Programming Differential Privacy"
[32]: http://www.gautamkamath.com/courses/CS860-fa2022.html "Gautam Kamath: CS 860 - Algorithms for Private Data Analysis - Fall 2022"