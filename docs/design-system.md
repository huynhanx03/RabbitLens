# RabbitLens design system

RabbitLens uses one shared visual language for the public connection flow and
the authenticated operator shell. The source of truth is
`website/src/styles/tokens.css` plus the components under `src/components/ui`.

## Token layers

1. **Primitive tokens** define raw color, spacing, radius and typography
   values.
2. **Semantic tokens** express intent: background, foreground, border,
   primary, destructive, muted, chart and focus-ring.
3. **Component tokens/classes** consume semantic intent. Components and
   features must not bypass this layer with an arbitrary palette.

The RabbitLens identity uses indigo for primary/selected interaction and amber
for the Lens accent. Warning and destructive states remain semantic states;
the brand accent must never communicate an operational warning by itself.

## Brand and layouts

`BrandLogo` is the canonical inline SVG mark. Use its `mark` or `lockup`
variant instead of recreating RabbitLens lettering or an image asset. The login
view uses the public layout; authenticated views use the application shell.
Both consume the same token contract and brand component.

## Component composition

- Start with `components/ui` primitives for controls, dialogs, tables and
  feedback.
- Use `components/shared` for generic operator patterns such as async state,
  confirm dialogs, toolbars, pagination and data tables.
- Keep resource-specific labels, payloads and query hooks in the owning domain
  or feature.
- Reuse a shared pattern only after at least two independent features need the
  same interaction and accessibility contract.

## Interaction and accessibility

- Maintain a visible focus indicator and use semantic status, not color alone.
- Dialogs must expose a title and have a cancel path. Destructive operations
  require explicit confirmation and show mutation errors in context.
- Tables need a meaningful accessible label where the surrounding heading is
  insufficient; dense data must retain responsive overflow behaviour.
- Charts require a textual availability/error state and must not be the only
  way to access essential operational data.

## Responsive rules

Use the existing responsive shell, toolbar and data viewport patterns. At
phone widths, prioritize the operational primary action and avoid document
horizontal overflow. Do not add a bespoke breakpoint to one feature when a
shared component already encodes the behaviour.

## Verification

The visual-contract, brand, shell, responsive and accessibility tests are the
minimum regression suite for design changes. Run the relevant Playwright
responsive/axe scenarios whenever modifying shared layout, tokens or controls.
