---
title: Official Guidance and Standardization
order: 2
---

Before diving into the main document, it is important to note that the two prominent standardization bodies, NIST and ISO/IEC, have been active in providing guidance and standardization in the space of data anonymization, and in particular differential privacy.

**ISO/IEC 20889:2018** ([34][34]): This standard by the ISO/IEC focuses broadly on de-identification techniques, including synthetic data and randomization techniques. Despite being a normative standard in part, differential privacy is introduced as a formal privacy measure in the style of an informative standard. Only ϵ-differential privacy is considered with Laplace, Gaussian and Exponential mechanisms and the concept of cumulative privacy loss. Interestingly, despite Gaussian noise typically being associated with (ϵ, δ)-differential privacy and zero-concentrated differential privacy, as will be introduced in section [(ϵ, δ)-Differential Privacy](TODO), these more nuanced privacy models are not defined.

**NIST SP 800-226 ipd** ([35][35]): The guidance paper extends far beyond ISO/IEC 20889:2018, considering multiple privacy models, considerations with regard to the conversion between privacy models, basic mechanisms, threat models in terms of local and central models and more. This is an excellent resource for understanding the nomenclature, security model and goals of applying differential privacy in practice. Throughout this document we endeavor to align the terminology with the NIST guidance paper, leaving formal definitions to the original source.

While the aforementioned resources are useful, neither explicitly provide guidelines on how to choose reasonable parameterization of differential privacy models in terms of privacy budgets, nor do they point to public benchmarks to help the community arrive at industry norms over the medium to long term. In the case of the ISO/IEC 20889:2018, the definitions are also limited to the most standard case which is often an oversimplification for real-world applications. In the course of this document, and where applicable, we will link to the terminology of the standard to provide a level of consistency for the reader. 

[34]: https://www.iso.org/standard/69373.html "Privacy enhancing data de-identification terminology and classification of techniques"
[35]: https://doi.org/10.6028/NIST.SP.800-226.ipd "J.P. Near, D. Darais: Guidelines for Evaluating Differential Privacy Guarantees"
