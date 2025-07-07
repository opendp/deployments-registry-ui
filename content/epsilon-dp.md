---
title: ε-Differential Privacy
---

Pure epsilon-differential privacy \\((\epsilon\)-DP\\) is a mathematical
guarantee that enables the sharing of aggregated statistics about a dataset while
protecting individual privacy by adding random noise. Simply put,
it ensures that the outcome of any analysis is nearly the same,
regardless of whether _any individual's data_ is either included or
removed from the dataset.

Formally, the privacy guarantee is quantified using the privacy parameter
\\(\epsilon\\) (epsilon). A randomized algorithm \\(A\\) is
\\(\epsilon\\)-differentially private if for all neighboring datasets
\\(D_1\\) and \\(D_2\\) (differing in at most one element), and for all
subsets of outputs \\(S \subseteq \text{Range}(M)\\)

$$
\Pr[M(D_1) \in S] \leq e^{\epsilon} \cdot \Pr[M(D_2) \in S]
$$