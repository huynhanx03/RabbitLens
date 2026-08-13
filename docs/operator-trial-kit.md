# Operator trial kit

The fastest honest way to establish RabbitLens value is a small, consented
trial with a real RabbitMQ operator. This kit keeps the request respectful and
the evidence useful.

## Ask

Send this to a person who already operates RabbitMQ:

> I maintain RabbitLens, an open-source replacement UI for RabbitMQ Management.
> Would you be willing to try it against a non-production broker for 20–30
> minutes? I am looking for one workflow that is clearer, one that is confusing,
> and your RabbitMQ version/plugin list. I will not publish your name, cluster
> details, or quote without your explicit permission.

## Trial script

1. Ask the operator to use a disposable or staging broker with a least-privilege
   RabbitMQ account.
2. Have them complete three normal flows: find a queue with a problem, inspect
   a connection/channel, and review a policy or user permission.
3. Ask them to open, but cancel, one destructive action so confirmation wording
   can be evaluated safely.
4. Record only the RabbitMQ version, enabled Management plugins, outcome, and
   redacted feedback in a GitHub issue or discussion.
5. Convert a reproducible defect into a bug report; convert a workflow need into
   a feature request. Do not create reports on the operator's behalf without
   their approval.

## Consent for a public quote

Ask separately:

> May I publish this exact quote, your role/company name, and the RabbitMQ
> version? You can approve any subset, or say no. I will link the public source
> only if you approve it.

## Publish a useful result

At the end of a batch of trials, add a short release-note or discussion summary:

- number of operators who tested;
- versions/plugins tested;
- workflows that improved;
- bugs/requests filed and resolved;
- anonymized quotes with explicit consent.

This establishes real adoption evidence without collecting credentials, message
payloads, private topology, or vanity activity.
