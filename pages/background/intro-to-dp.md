---
title: Differential Privacy
order: 1
class: intro-to-dp
layout: docs
---

## Randomized Response Surveys

Before the age of big data and data science, traditional data collection faced the challenge called the evasive answer bias. That is to say, people not answering survey questions honestly in fear that their answers may be used against them. Randomized responses emerged in the mid-twentieth century to address this.

Randomized response is a technique to protect the privacy of individuals in surveys. It involves adding local noise, such as flipping a coin multiple times and assigning the responses of the individual based on the coin-flip sequence. In doing so, the responses can be true in expectation but any given response is uncertain. This uncertainty over the response of an individual is one of the first applications of differential privacy, although it was not called as such at the time and the quantification of privacy was simply the weighting of probabilities determined by the mechanism. 

{% include image.html
    url="/assets/images/randomized-response.png"
    alt="On the left a coin is flipped, it branches to the right and Truth is on one branch, and another coin flip on the other. The second flip determines Truth or Lie. Truth : Lie :: 3 : 1"
    caption="An example of using a conditional coin-flip to achieve plausible deniability with a calibrated bias."
%}

This approach of randomizing the output of the answer to a question by a mechanism, a stochastic intervention such as coin flipping, is still the very backbone of differential privacy today.

(The original approach by S.L. Warner actually involved spinning a "spinner" and as such he could easily change the weighting of the outcome based on the proportion of the circle assigned to each outcome. Whether you prefer a mental model of a roulette wheel, a spinner, coins flipping or dice rolling, as long as we can portray a well calibrated stochastic mechanism which is biased towards the truth, then the approach will work.)

# Flavors of Differential Privacy

Since the original development of DP, several other variants of the
definition have been developed that maintain its most important
properties while offering some additional benefits.

In contrast to the original DP definition, the variants described
below can be satisfied using Gaussian noise (which has several
important benefits) and also offer tighter composition bounds in many
cases. The variants are commonly used in real-world deployments
because these advantages can be significant for large releases.

All of the variants described below are relaxations of pure DP,
meaning that their guarantees are no stronger than pure DP. In some
cases, their guarantees can be weaker. In rare cases, they're
significantly weaker.

The table below summarizes the most commonly used variants of DP. Each
has a different set of privacy parameters that describe the strength
of the guarantee. These parameters are described below.


|               Flavor | Privacy Parameter(s) |
|---------------------:|----------------------|
|              Pure DP | ε                    |
|       Approximate DP | ε, δ                 |
| Zero-concentrated DP | ρ                    |
|             Rényi DP | α, ε                 |
|          Gaussian DP | μ                    |

**Why does it matter?** Variants of DP other than pure DP provide
weaker formal guarantees, but are commonly used due to their
significant benefits in privacy analysis and utility. Comparing and
interpreting the privacy parameters of different variants is
nontrivial and requires careful consideration.


## Pure DP

[Pure DP](https://en.wikipedia.org/wiki/Differential_privacy) has a
single privacy parameter (ε). A smaller value for ε indicates better
privacy. The formal definition says that for all neighboring databases
\\(D_1\\) and \\(D_2\\) and subsets of outputs \\(S\\), a mechanism \\(M\\) satisfies
\\(\epsilon\\)-DP if:

<!-- eslint-disable markdown/no-missing-label-refs -->

$$
\frac{\Pr[M(D_1) \in S]}{\Pr[M(D_2) \in S]} \leq e^{\epsilon}
$$

<!-- eslint-enable markdown/no-missing-label-refs -->

### Randomized Response was ϵ-Differential Privacy

Although randomized response surveys predate the formal definition of differential privacy by over 40 years, the technique directly maps to the binary mechanism used in modern differential privacy. 

Assume you wish to set up the spinner originally proposed by Warner
to achieve ϵ-differential privacy. This can be done by asking
participants to tell the truth with probability
\\(\frac{e^{\frac{\epsilon}{2}}}{1 + e^{\frac{\epsilon}{2}}}\\). This is
known in the literature as the binary mechanism.

This mechanism is incredibly useful for building intuition among a non-technical audience. One of the simplest questions we can ask is: “Is Alice in this dataset?” Depending on the level of privacy, the probability of answering truthfully will vary. We illustrate this relationship below.

<div class="table-container">
<table>
    <thead>
        <tr>
            <th>ϵ</th>
            <th>Probability of Truth</th>
            <th>Odds of Truth</th>
        </tr>
    </thead>
    <tbody id="probability-table-body"></tbody>
</table>
</div>
<script type="module" src="/assets/js/probability-table.js"></script>

While the above odds are merely illustrative, they help convey the practical meaning of epsilon
in relation to the more intuitive randomized response mechanism. As a point of reference, theorists
often advocate for \\(\epsilon \approx 1\\) for differential privacy
guarantees to have a meaningful privacy assurance.


### Intuition of the Laplace Mechanism

One of the most widely used mechanisms in ϵ-differential privacy is the
Laplace mechanism. It is used when we are adding bounded values
together such as counts or summations of private values, provided the
extreme values (usually referenced as _bounds_) of the private
values are known and hence the maximum contribution of any data
subject is _bounded_.

In practice, the true sum is first computed, then noise is sampled from the Laplace distribution, and finally this noise is added to the result.
For example, if you're counting and all the values lie within range in (0, 1), the widget below shows how the
distribution of noise and expected error change as
ϵ varies.

Note that the error is additive and so we can make claims about the
absolute error, but not the relative error of the final stochastic
result.

<div class="diagram-container">
<div id="epsilon-expected-error"></div>
</div>
<script type="module" src="/assets/js/epsilon-expected-error.js"></script>


## Approximate DP

[Approximate DP](https://en.wikipedia.org/wiki/Differential_privacy)
has two privacy parameters (ε and δ). As in pure DP, a smaller value
for ε indicates better privacy. The second parameter, δ, is an
additive relaxation parameter. It is often interpreted as a "failure
probability" - with probability δ, the privacy guarantee may fail.
This interpretation provides useful intuition, though [it is not
precisely correct](https://arxiv.org/abs/1906.01337). The δ parameter
should be set very small - typical values are around \\(10^{-5}\\) or
smaller, and the rule of thumb is to set $\delta \leq \frac{1}{n^2}$
where \\(n\\) is the size of the database. The formal definition says that
for all neighboring databases \\(D_1\\) and \\(D_2\\) and subsets of outputs
\\(S\\), a mechanism \\(M\\) satisfies \\((\epsilon, \delta)\\)-DP if:

<!-- eslint-disable markdown/no-missing-label-refs -->

$$
\Pr[M(D_1) \in S] \leq e^\epsilon \Pr[M(D_2) \in S] + \delta
$$

<!-- eslint-enable markdown/no-missing-label-refs -->

The following widget describes the expected error for noise added under (ϵ, δ)-DP.

<div class="diagram-container">
<div id="laplace-to-gaussian"></div>
</div>
<script type="module" src="/assets/js/laplace-to-gaussian.js"></script>

## Zero-concentrated DP

[Zero-concentrated DP (zCDP)](https://arxiv.org/abs/1605.02065) has a
single privacy parameter (ρ). A smaller value for ρ indicates better
privacy. Typical values for ρ are quite different from typical values
of ε, and they cannot be directly compared. A zCDP guarantee can be
"converted" into an approximate DP guarantee, which can allow for
comparisons between parameters, but this conversion may be imprecise.
The formal definition says that for all neighboring databases \\(D_1\\)
and \\(D_2\\) and subsets of outputs \\(S\\), a mechanism $M$ satisfies
\\(\rho\\)-zCDP if:

<!-- eslint-disable markdown/no-missing-label-refs -->

$$
\forall \alpha \geq 1. D_\alpha(M(D_1) || M(D_2)) \leq \alpha \rho
$$

<!-- eslint-enable markdown/no-missing-label-refs -->

where $D_\alpha$ is the [Rényi
divergence](https://en.wikipedia.org/wiki/R%C3%A9nyi_entropy#R%C3%A9nyi_divergence)
of order $\alpha$.

## Rényi DP

[Rényi DP (RDP)](https://arxiv.org/abs/1702.07476) has two privacy
parameters (α and ε). As in other definitions, a smaller value for ε
indicates better privacy, though RDP ε values cannot be directly
compared with ε values from other variants without considering the
value of α. The α parameter is an integer greater than 1, and larger
values of α indicate better privacy.

Like zCDP, a RDP guarantee can be "converted" into an approximate DP
guarantee, but the conversion may be imprecise. The formal definition
says that for all neighboring databases \\(D_1\\) and \\(D_2\\) and subsets of
outputs \\(S\\), a mechanism \\(M\\) satisfies \\((\alpha, \epsilon)\\)-RDP if:

<!-- eslint-disable markdown/no-missing-label-refs -->

$$
D_\alpha(M(D_1) || M(D_2)) \leq \epsilon
$$

<!-- eslint-enable markdown/no-missing-label-refs -->

where \\(D_\alpha\\) is the [Rényi
divergence](https://en.wikipedia.org/wiki/R%C3%A9nyi_entropy#R%C3%A9nyi_divergence)
of order \\(\alpha\\).
