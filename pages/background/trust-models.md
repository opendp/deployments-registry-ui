---
title: Trust Models
order: 2
class: trust-models
layout: docs
---

## The Local Model

<div>The local model in differential privacy, as defined in the ISO/IEC ({%- include bib-link.html key="ISO" -%}), is a threat model that provides strong privacy guarantees before data is collected by a central entity. In this model, each user adds noise to their own data locally (for example, on their own phone or laptop, before it is sent to a processing server). This ensures their privacy is protected even if the data is intercepted in transit or in the case they do not trust the central curator.</div>

Since the noise is added very early in the pipeline, local differential privacy trades off usability and accuracy for stronger individual privacy guarantees. This means that while each user's data is protected even before it reaches the central server, the aggregated results might be less accurate compared to global differential privacy where noise is added after data aggregation.
In local differential privacy, each data subject applies randomization as a disclosure control locally before sharing their outputs with the central aggregator.

{% include image.html
    url="/assets/images/local-dp.png"
    alt="Coin flips on the left are separated from the aggregator on the right by a privacy barrier."
    caption="In local differential privacy, each data subject applies randomization as a disclosure control locally before sharing their outputs with the central aggregator."
%}

## The Central Model

<div>Opposite from the previous section, the central model refers to the model where the privacy mechanisms are applied centrally, after data collection. In this model, individuals provide raw data and place their trust in the curator, which is intended to add privacy protections in a downstream task. This is often referred to as the global model or the server model, as defined in the ISO/IEC ({%- include bib-link.html key="ISO" -%}).</div>

{% include image.html
    url="/assets/images/central-dp.png"
    alt="Data subjects on the left are directly connected to aggregator on the right. Coin flip and privacy barrier follow."
    caption="In central differential privacy, each data subject shares their private information with the trusted aggregator. Randomization is applied as a disclosure control prior to broader dissemination."
%}

## Trusted vs Adversarial Curator

When we define a threat model, we mainly focus on how much trust we place in the curator. A trusted curator is assumed to apply DP in a correct manner, while in contrast, an adversarial curator may (and we assume it always does) attempt to breach privacy.

As such, these concepts are strongly related to the locality of our DP model, which we previously defined as local and global DP. For the local DP protocol, we place no trust in the central curator, thus we can perfectly accept a model where the curator is adversarial, since the privacy guarantees are put in place by the user in a local manner. On the other hand, for global DP, we expect the curator to set these privacy guarantees in place, and as such we place all the trust in them. 

## Static vs Interactive Releases

These two concepts refer to how often we publish DP statistics. A static release involves publishing a single release with no further interactions, while interactive releases repeat these processes, for example, by allowing multiple queries on the dataset. Static releases are simpler, but interactive releases could offer additional utility, but require a more robust privacy measurement for each query due to composition. 


## Unit of Privacy

The *unit of privacy* describes the entity being protected by a DP
guarantee. Common settings for the unit of privacy include:

- Person-level privacy: the entity being protected is *one person*
- User-level privacy: the entity being protected is *one user*, which
  is usually (but not always) the same as one person
- Event-level privacy: the entity being protected is *one event*,
  which is usually not the same as one person

DP guarantees with different units of privacy provide very different
levels of protection to individuals. For example, a dataset of taxi
trips may include many trips taken by the same person:

- A person-level privacy guarantee would prevent an adversary from
  learning whether or not an individual took *any* taxi trips
- An event-level guarantee would prevent the adversary from learning
  whether a *single* trip occurred, but might reveal the rough number
  of trips an individual has taken
- A user-level guarantee might fall somewhere in between: it could be
  equivalent to a person-level guarantee for a person with a single
  user account might, but it might be closer to an event-level
  guarantee for a person who creates a new user account for every trip

Formally, the unit of privacy defines which databases are neighboring.
All variants of differential privacy consider neighboring databases
\\(D_1\\) and \\(D_2\\); the unit of privacy defines what it means for \\(D_1\\)
and \\(D_2\\) to be neighbors:

- For a person-level guarantee, \\(D_1\\) and \\(D_2\\) may differ in one
  person's data (e.g. all of the rows of data associated with the
  person)
- For an event-level guarantee, \\(D_1\\) and \\(D_2\\) may differ in data
  associated with one event (e.g. one row of data associated with a
  particular event)
- For a user-level guarantee, \\(D_1\\) and \\(D_2\\) may differ in one user's
  data

This distinction may seem subtle, but it can have huge impacts on
real-world privacy. The definition of neighboring databases directly
influences how much noise is used when releasing statistics, so
adjusting the unit of privacy can have the effect of significantly
increasing or decreasing the amount of noise - *without changing the
privacy parameter(s)*.

In our taxi example, if a single person might take up to 10 trips,
then moving from a person-level guarantee to an event-level guarantee
(i.e. a trip-level guarantee) would enable releasing the *same
statistics* under the *same privacy budget*, but with
*\\(\frac{1}{10}\\)th the amount of noise*.

**Why does it matter?** The most conservative choice for the unit of
privacy is a person-level guarantee. Other units of privacy can be
more difficult to relate to our intuition about privacy, and may lead
to significantly weakened real-world privacy, sometimes in
unpredictable ways.



