// The texts and previews of the design system in Claude Design. Each preview mirrors the
// stories of its component; the labels are examples, in English like the interface.

export type ComponentCard = {
  name: string
  group: string
  height: number
  readme: string
  /** The body of the preview script: `P` is `window.Portflow`, `h` is `React.createElement`. */
  render: string
}

export const README = `# Portflow

The design system of Portflow, the bulk discharge management of a port site: one set of
tokens and components for the office screens (dense tables, keyboard) and the field
screens (tablets and phones, gloves, sunlight).

This system is generated from the code, \`packages/design-system\` of the repository
(ADR 0019). It is read-only here: a change is made in the code, then the system is synced
again. When the two differ, the code is right.

## Principles

- **Semantic tokens only.** A component names what a colour is for (\`surface\`,
  \`text-muted\`, \`primary\`, \`danger\`), never a raw colour, spacing or font size.
- **Three themes, one set of names.** \`light\` is the default, \`dark\` for dim rooms,
  \`contrast\` for field screens in sunlight: black on white, strong borders. A theme
  changes values, never components.
- **Two densities.** \`office\` (controls 36px high, dense tables) and \`field\` (every
  control at least 44px high: touch targets with gloves). The field layout always uses
  the field density; a coarse pointer gets it by default.
- **Every width.** From a phone (below 640px) to a wide screen, with no horizontal scroll
  of the page. Mobile first: the narrow form is the base, wider screens add to it. A
  dense table becomes one card per row on narrow screens.
- **Every read has its states.** Loading (a status with a placeholder), empty (what is
  missing and the action that fills it), error (what went wrong and a retry). Prefer an
  undo toast to a confirmation dialog.
- **Real elements.** Buttons are buttons, links are links, every control has a label.
  Everything is reachable and operable with the keyboard. UI copy is in English.

## Visual foundations

- **Colour.** Neutral slate surfaces and ink; one blue for primary actions and links;
  red, green and amber only for danger, success and warning. Every text pair reaches
  4.5:1 and every control border and focus ring 3:1, in the three themes.
- **Type.** The system typeface of the device, no web font to load on a weak network.
  Body text 16px (14px in dense tables), headings semibold.
- **Shape.** Small radii (4 to 8px), hairline borders between rows, soft shadows only on
  what floats (dialogs, menus, toasts).
- **Spacing.** The 4px scale of Tailwind. Control heights and table row padding come
  from the density.

## Layouts

- **Page layout**: one centred column, for technical pages and the states of a route.
- **Office layout**: a navigation and the content; the navigation is a bar above the
  content below 1024px, a column on the left from 1024px.
- **Field layout**: one task per screen, its title on top, its actions pinned at the
  bottom.

## Iconography

Icons come from Lucide, at 16px inside controls, in the colour of the text around them.
An icon never carries meaning alone: it sits next to a label, or the control has an
accessible name.

## Not synced

- The palette, the typeface and the look of the three themes are a proposal awaiting
  the decision of the maintainer.
- There is no logo yet: the name is set in plain type.
`

const card = (
  name: string,
  group: string,
  height: number,
  readme: string,
  render: string,
): ComponentCard => ({ name, group, height, readme, render })

export const COMPONENTS: ComponentCard[] = [
  card(
    'Button',
    'Actions',
    72,
    `# Button

The action of a screen: it does something, where a link goes somewhere.

- \`variant\`: \`default\` (the main action, one per area), \`secondary\`, \`outline\`, \`ghost\`
  (toolbars, navigation), \`destructive\` (an action that deletes), \`link\`.
- \`size\`: \`default\` follows the density (36px office, 44px field); \`sm\`, \`lg\` and the
  \`icon\` sizes are for office screens only.
- \`asChild\` renders the child element (a router link) with the look of a button.
- A disabled button says why next to it, and how to unblock it.
`,
    `h('div', { className: 'flex flex-wrap gap-2' },
      h(P.Button, null, 'Record'),
      h(P.Button, { variant: 'secondary' }, 'Secondary'),
      h(P.Button, { variant: 'outline' }, 'Cancel'),
      h(P.Button, { variant: 'ghost' }, 'Ghost'),
      h(P.Button, { variant: 'destructive' }, 'Delete'),
      h(P.Button, { variant: 'link' }, 'Link'))`,
  ),
  card(
    'PendingButton',
    'Actions',
    56,
    `# PendingButton

A button whose action takes time: a submit button, or an action button bound to the
pending state of its request.

- \`pending\`: while the action runs, the button is disabled, shows a spinner and says it
  is busy (\`aria-busy\`), so that the action is never sent twice. It keeps its label.
- Takes the \`variant\` and the \`size\` of \`Button\`, which it is built on.
`,
    `h('div', { className: 'flex flex-wrap gap-2' },
      h(P.PendingButton, { pending: false }, 'Close the hold'),
      h(P.PendingButton, { pending: true }, 'Close the hold'))`,
  ),
  card(
    'Badge',
    'Status',
    56,
    `# Badge

A short status next to a datum: open, planned, refused.

- \`variant\`: \`default\`, \`secondary\` (a neutral status), \`destructive\` (a refusal or
  an error), \`outline\` (a closed or archived item).
- Words, never colour alone: the label says the status.
`,
    `h('div', { className: 'flex flex-wrap gap-2' },
      h(P.Badge, null, 'Open'),
      h(P.Badge, { variant: 'secondary' }, 'Planned'),
      h(P.Badge, { variant: 'destructive' }, 'Refused'),
      h(P.Badge, { variant: 'outline' }, 'Closed'))`,
  ),
  card(
    'Input',
    'Forms',
    96,
    `# Input

A text field, always named by a \`Label\` (\`htmlFor\` and \`id\`).

- Its height follows the density. \`aria-invalid\` shows an error; the message is a text
  next to it, never the colour alone.
- \`inputMode="decimal"\` for weights, so that a phone opens its number keyboard.
`,
    `h('div', { className: 'flex max-w-sm flex-col gap-2' },
      h(P.Label, { htmlFor: 'vessel' }, 'Vessel'),
      h(P.Input, { id: 'vessel', placeholder: 'Name of the vessel' }))`,
  ),
  card(
    'Label',
    'Forms',
    56,
    `# Label

The name of a control, read by assistive technologies and clickable to focus it.

- Pair it with an \`Input\` or a \`Select\` through \`htmlFor\`; wrap a \`Checkbox\` in it.
`,
    `h(P.Label, null, 'Berth')`,
  ),
  card(
    'Checkbox',
    'Forms',
    104,
    `# Checkbox

An option that is on or off, inside its \`Label\` so that the whole label is the target.

- Toggled with Space. For one choice among several, use a \`Select\`.
`,
    `h('div', { className: 'flex flex-col gap-3' },
      h(P.Label, null, h(P.Checkbox, null), 'Night shift'),
      h(P.Label, null, h(P.Checkbox, { defaultChecked: true }), 'Rain stop'),
      h(P.Label, null, h(P.Checkbox, { disabled: true }), 'Closed hold'))`,
  ),
  card(
    'Select',
    'Forms',
    96,
    `# Select

One choice in a short list, named by a \`Label\`.

- Parts: \`Select\`, \`SelectTrigger\` (give it the \`id\` of the label), \`SelectValue\`
  (its \`placeholder\`), \`SelectContent\`, \`SelectItem\`.
- Opened and chosen with the keyboard. A long list that needs a search is another
  component, not this one.
`,
    `h('div', { className: 'flex max-w-sm flex-col gap-2' },
      h(P.Label, { htmlFor: 'berth' }, 'Berth'),
      h(P.Select, null,
        h(P.SelectTrigger, { id: 'berth', className: 'w-full' }, h(P.SelectValue, { placeholder: 'Choose a berth' })),
        h(P.SelectContent, null,
          h(P.SelectItem, { value: 'north' }, 'North quay'),
          h(P.SelectItem, { value: 'south' }, 'South quay'))))`,
  ),
  card(
    'Form',
    'Forms',
    260,
    `# Form

A form of a screen, built with \`useAppForm\` (TanStack Form) and assembled from small
parts, never configured through props.

- \`form.AppForm\` around \`form.Form\`; in it, one \`form.AppField name="..."\` per field,
  whose children assemble \`field.Field\`, \`field.Label\`, \`field.TextInput\` or
  \`field.NumberInput\` (the decimal keyboard) and \`field.Error\`; then
  \`form.SubmitButton\`, a \`PendingButton\` while the form is sent.
- The schema of the form (Zod) goes in \`validators.onDynamic\`. A field is checked when
  it loses the focus and when the form is submitted, then at each change once it shows
  an error.
- An error shows under its field, in words. An error that no field can show, and a
  success, show in a toast.
`,
    `h(function WeighingForm() {
      var form = P.useAppForm({
        defaultValues: { truck: '', tonnage: '' },
        validators: { onDynamic: function (props) {
          var fields = {}
          if (!props.value.truck.trim()) fields.truck = 'Enter the plate of the truck'
          if (!(Number(props.value.tonnage) > 0)) fields.tonnage = 'Enter a weight above zero'
          return Object.keys(fields).length > 0 ? { fields: fields } : undefined
        } },
        onSubmit: function () { P.showSuccessToast('Weighing recorded') },
      })
      function field(name, label, Input) {
        return h(form.AppField, { name: name }, function (f) {
          return h(f.Field, null, h(f.Label, null, label), h(f[Input]), h(f.Error))
        })
      }
      return h('div', null, h(P.Toaster, { position: 'top-left' }),
        h(form.AppForm, null,
          h(form.Form, { 'aria-label': 'Weighing', className: 'max-w-sm' },
            field('truck', 'Truck', 'TextInput'),
            field('tonnage', 'Gross weight (t)', 'NumberInput'),
            h(form.SubmitButton, { className: 'self-start' }, 'Record'))))
    })`,
  ),
  card(
    'Dialog',
    'Overlays',
    320,
    `# Dialog

A task that must be finished or cancelled before going on, over the page.

- Parts: \`Dialog\`, \`DialogTrigger\`, \`DialogContent\` (with its close button),
  \`DialogHeader\`, \`DialogTitle\` (its accessible name), \`DialogDescription\`,
  \`DialogFooter\`, \`DialogClose\`.
- Closed with Escape; the focus comes back to the trigger.
- Prefer a visible correction path (an undo toast) to a confirmation dialog.
`,
    `h(P.Dialog, { defaultOpen: true },
      h(P.DialogTrigger, { asChild: true }, h(P.Button, { variant: 'outline' }, 'Close the hold')),
      h(P.DialogContent, null,
        h(P.DialogHeader, null,
          h(P.DialogTitle, null, 'Close hold 3'),
          h(P.DialogDescription, null, 'No more weighings can be recorded on it.')),
        h(P.DialogFooter, null,
          h(P.DialogClose, { asChild: true }, h(P.Button, { variant: 'outline' }, 'Cancel')),
          h(P.Button, null, 'Close the hold'))))`,
  ),
  card(
    'Tooltip',
    'Overlays',
    120,
    `# Tooltip

A short hint on a control, shown on hover and on keyboard focus.

- Parts: \`TooltipProvider\` (once, near the root), \`Tooltip\`, \`TooltipTrigger\`,
  \`TooltipContent\`.
- Never the only place of an information the user needs: touch screens have no hover.
`,
    `h(P.TooltipProvider, null,
      h('div', { style: { paddingTop: '48px' } },
        h(P.Tooltip, { defaultOpen: true },
          h(P.TooltipTrigger, { asChild: true }, h(P.Button, { variant: 'outline' }, 'Export')),
          h(P.TooltipContent, null, 'Export the weighings as a spreadsheet'))))`,
  ),
  card(
    'Toaster',
    'Overlays',
    200,
    `# Toaster

Where the toasts of the app appear: rendered once, near the root. A toast tells the
result of an action without stopping the user.

- After a form or an action: \`showSuccessToast('Vessel announced')\` when it went well,
  \`showErrorToast(label)\` when it failed for a reason no field can show. Both stay the
  same time.
- Other toasts: \`toast('...')\`, \`toast.warning\`.
- **Undo toast**: \`showUndoToast({ message, undoLabel, onUndo })\` says what was just
  done and offers to undo it for a few seconds: the correction path to prefer over a
  confirmation dialog.
`,
    `(function () {
      setTimeout(function () {
        P.showUndoToast({ message: 'Weighing deleted', undoLabel: 'Undo', onUndo: function () {} })
      }, 50)
      return h('div', null, h(P.Toaster, { position: 'top-left' }),
        h(P.Button, { variant: 'destructive', onClick: function () {
          P.showUndoToast({ message: 'Weighing deleted', undoLabel: 'Undo', onUndo: function () {} })
        } }, 'Delete the weighing'))
    })()`,
  ),
  card(
    'Tabs',
    'Navigation',
    120,
    `# Tabs

Views of the same subject, one shown at a time.

- Parts: \`Tabs\`, \`TabsList\`, \`TabsTrigger\`, \`TabsContent\`. Arrow keys move between
  tabs.
- When the view must survive a reload or be shared, keep it in the URL.
`,
    `h(P.Tabs, { defaultValue: 'holds' },
      h(P.TabsList, null,
        h(P.TabsTrigger, { value: 'holds' }, 'Holds'),
        h(P.TabsTrigger, { value: 'weighings' }, 'Weighings'),
        h(P.TabsTrigger, { value: 'stops' }, 'Stops')),
      h(P.TabsContent, { value: 'holds' }, 'Three holds.'),
      h(P.TabsContent, { value: 'weighings' }, 'Twelve weighings.'),
      h(P.TabsContent, { value: 'stops' }, 'No stop.'))`,
  ),
  card(
    'Table',
    'Data',
    200,
    `# Table

A table of data, named by its caption. Its rows follow the density.

- Parts: \`Table\`, \`TableCaption\`, \`TableHeader\`, \`TableBody\`, \`TableFooter\`,
  \`TableRow\`, \`TableHead\`, \`TableCell\`. A header of a row is a \`TableHead\` with
  \`scope="row"\`.
- A table wider than the screen scrolls inside itself, never the page. A dense table
  with many columns uses \`ResponsiveTable\` instead.
`,
    `h(P.Table, null,
      h(P.TableCaption, null, 'Holds of the vessel'),
      h(P.TableHeader, null, h(P.TableRow, null,
        h(P.TableHead, null, 'Hold'), h(P.TableHead, null, 'Product'), h(P.TableHead, { className: 'text-right' }, 'Tonnage'))),
      h(P.TableBody, null,
        [['Hold 1', 'Wheat', '4,210 t'], ['Hold 2', 'Barley', '3,980 t'], ['Hold 3', 'Wheat', '4,005 t']].map(function (row) {
          return h(P.TableRow, { key: row[0] },
            h(P.TableHead, { scope: 'row' }, row[0]), h(P.TableCell, null, row[1]), h(P.TableCell, { className: 'text-right' }, row[2]))
        })))`,
  ),
  card(
    'ResponsiveTable',
    'Data',
    240,
    `# ResponsiveTable

A dense table that becomes one card per row below 768px: the same elements at every
width, only the CSS changes.

- Parts: \`ResponsiveTable\`, \`ResponsiveTableCaption\`, \`ResponsiveTableHeader\`,
  \`ResponsiveTableBody\`, \`ResponsiveTableRow\`, \`ResponsiveTableHead\`,
  \`ResponsiveTableCell\`.
- Each \`ResponsiveTableCell\` takes the name of its column as \`label\`: a card shows it
  before the value. No datum and no action is hidden on a narrow screen.
`,
    `(function () {
      var columns = ['Truck', 'Hold', 'Gross', 'Net']
      var rows = [['AB-123-CD', 'Hold 1', '41.2 t', '28.4 t'], ['EF-456-GH', 'Hold 2', '40.7 t', '27.6 t']]
      return h(P.ResponsiveTable, null,
        h(P.ResponsiveTableCaption, null, 'Weighings of the day'),
        h(P.ResponsiveTableHeader, null, h(P.ResponsiveTableRow, null,
          columns.map(function (c) { return h(P.ResponsiveTableHead, { key: c }, c) }))),
        h(P.ResponsiveTableBody, null, rows.map(function (row) {
          return h(P.ResponsiveTableRow, { key: row[0] }, row.map(function (value, i) {
            return h(P.ResponsiveTableCell, { key: columns[i], label: columns[i] }, value)
          }))
        })))
    })()`,
  ),
  card(
    'Skeleton',
    'Feedback',
    96,
    `# Skeleton

A grey shape standing for content that loads. Used by \`LoadingState\`; on its own, hide
it from assistive technologies and give the section a status.
`,
    `h('div', { className: 'flex max-w-sm flex-col gap-2' },
      h(P.Skeleton, { className: 'h-control w-full' }),
      h(P.Skeleton, { className: 'h-control w-2/3' }))`,
  ),
  card(
    'LoadingState',
    'Feedback',
    160,
    `# LoadingState

What a page or a section shows while its data loads: a live region that reads its label,
and a placeholder of the content.

- Parts: \`LoadingState\` (an \`<output>\`, role \`status\`), \`LoadingStateLabel\` ("Loading…"),
  \`LoadingStatePlaceholder\`.
`,
    `h(P.LoadingState, null,
      h(P.LoadingStateLabel, null, 'Loading…'),
      h(P.LoadingStatePlaceholder, null))`,
  ),
  card(
    'EmptyState',
    'Feedback',
    176,
    `# EmptyState

What a list or a page shows when there is nothing yet: what is missing, and the action
that fills it.

- Parts: \`EmptyState\`, \`EmptyStateTitle\`, \`EmptyStateDescription\`,
  \`EmptyStateActions\`.
- A filtered list that finds nothing offers to change the filters, not to create.
`,
    `h(P.EmptyState, null,
      h(P.EmptyStateTitle, null, 'No vessel yet'),
      h(P.EmptyStateDescription, null, 'Vessels appear here once announced.'),
      h(P.EmptyStateActions, null, h(P.Button, null, 'Announce a vessel')))`,
  ),
  card(
    'ErrorState',
    'Feedback',
    136,
    `# ErrorState

What a page or a section shows when its data could not be read: an alert, read out when
it appears, with what went wrong and a way to try again.

- Parts: \`ErrorState\` (role \`alert\`), \`ErrorStateMessage\` (in the words of the user,
  never a technical code), \`ErrorStateActions\` (usually "Try again").
`,
    `h(P.ErrorState, null,
      h(P.ErrorStateMessage, null, 'The service cannot be reached. Try again in a moment.'),
      h(P.ErrorStateActions, null, h(P.Button, { variant: 'outline' }, 'Try again')))`,
  ),
  card(
    'PageLayout',
    'Templates',
    160,
    `# PageLayout

A page of one centred column: technical pages and the states of a route.

- Parts: \`PageLayout\` (the \`main\` of the page), \`PageLayoutTitle\` (its \`h1\`).
- Slots only: the page puts its content inside.
`,
    `h(P.PageLayout, null,
      h(P.PageLayoutTitle, null, 'Service health'),
      h('p', null, 'One column, centred.'))`,
  ),
  card(
    'OfficeLayout',
    'Templates',
    360,
    `# OfficeLayout

The layout of the office screens: a navigation and the content.

- Parts: \`OfficeLayout\`, \`OfficeLayoutNav\` (name it with \`aria-label\`),
  \`OfficeLayoutNavTitle\`, \`OfficeLayoutNavList\`, \`OfficeLayoutNavItem\`,
  \`OfficeLayoutContent\` (the \`main\`).
- Below 1024px the navigation is a bar above the content whose links scroll inside it;
  from 1024px it is a column on the left. The page never scrolls sideways.
- A link of the navigation takes the look of a ghost button; the current one is
  \`secondary\` with \`aria-current="page"\`.
`,
    `h(P.OfficeLayout, { className: 'min-h-0' },
      h(P.OfficeLayoutNav, { 'aria-label': 'Sections' },
        h(P.OfficeLayoutNavTitle, null, 'Portflow'),
        h(P.OfficeLayoutNavList, null, ['Vessels', 'Discharges', 'Weighings', 'Trucks'].map(function (s, i) {
          return h(P.OfficeLayoutNavItem, { key: s }, h('a', {
            href: '#', 'aria-current': i === 0 ? 'page' : undefined,
            className: P.buttonVariants({ variant: i === 0 ? 'secondary' : 'ghost', className: 'w-full justify-start' })
          }, s))
        }))),
      h(P.OfficeLayoutContent, null,
        h('h1', { className: 'text-2xl font-semibold' }, 'Vessels'),
        h(P.EmptyState, null,
          h(P.EmptyStateTitle, null, 'No vessel yet'),
          h(P.EmptyStateActions, null, h(P.Button, null, 'Announce a vessel')))))`,
  ),
  card(
    'FieldLayout',
    'Templates',
    400,
    `# FieldLayout

The layout of the field screens: one task per screen, its actions pinned at the bottom.

- Parts: \`FieldLayout\` (sets the field density: every control at least 44px),
  \`FieldLayoutHeader\`, \`FieldLayoutTitle\` (the task, an \`h1\`), \`FieldLayoutContent\`
  (the \`main\`), \`FieldLayoutActions\`.
- One task: no navigation inside the screen, no second form.
`,
    `h(P.FieldLayout, { className: 'min-h-0' },
      h(P.FieldLayoutHeader, null, h(P.FieldLayoutTitle, null, 'Record a weighing')),
      h(P.FieldLayoutContent, null,
        h('div', { className: 'flex flex-col gap-2' },
          h(P.Label, { htmlFor: 'truck' }, 'Truck'),
          h(P.Input, { id: 'truck', placeholder: 'Registration' })),
        h('div', { className: 'flex flex-col gap-2' },
          h(P.Label, { htmlFor: 'gross' }, 'Gross weight (t)'),
          h(P.Input, { id: 'gross', inputMode: 'decimal' }))),
      h(P.FieldLayoutActions, null,
        h(P.Button, { variant: 'outline' }, 'Cancel'),
        h(P.Button, null, 'Record')))`,
  ),
]

/**
 * The cover: the palette as blocks and a stack of containers cut from the radius tokens,
 * with the name. Every fill is a token, so it follows the theme.
 */
export const COVER = `<!-- @dsCard height=288 -->
<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Portflow — cover</title>
<style>
  html, body { margin: 0; background: var(--background); }
  .cover { position: relative; width: 960px; height: 288px; overflow: hidden; font-family: var(--font-sans); }
  .cover svg { position: absolute; inset: 0; }
  .primary { fill: var(--primary); }
  .ink { fill: var(--text); }
  .muted { fill: var(--surface-muted); }
  .warning { fill: var(--warning); }
  .success { fill: var(--success); }
  .danger { fill: var(--danger); }
  .tile { rx: var(--radius-sm); }
  .block { rx: var(--radius-lg); }
  .name { position: absolute; left: 48px; bottom: 48px; max-width: 440px; }
  .name h1 { margin: 0; font-size: 88px; line-height: .95; font-weight: 700; color: var(--text); letter-spacing: -0.02em; }
  .name p { margin: 12px 0 0; font-size: 14px; color: var(--text-muted); }
</style>
</head>
<body>
<div class="cover">
  <svg viewBox="0 0 960 288" width="960" height="288" aria-hidden="true">
    <!--
      blocks: primary 192×288 (bleeds top and bottom), ink 112×136, surface-muted 112×136 tint
      arrangement: one tall slab on the right edge with two satellites, containers stacked on the quay to its left
      pattern: geometric modular tiles (dense UI, a port): containers 48×24 cut by radius-sm, a gap of spacing 2 (8px)
      steps and radii: tiles 48×24, gap 8, blocks radius-lg, tiles radius-sm
    -->
    <rect class="block primary" x="768" y="-16" width="192" height="320"/>
    <rect class="block ink" x="640" y="0" width="112" height="136"/>
    <rect class="block muted" x="640" y="152" width="112" height="136"/>
    <g>
      <rect class="tile primary" x="504" y="240" width="48" height="24"/>
      <rect class="tile ink" x="560" y="240" width="48" height="24"/>
      <rect class="tile warning" x="504" y="208" width="48" height="24"/>
      <rect class="tile primary" x="560" y="208" width="48" height="24"/>
      <rect class="tile ink" x="504" y="176" width="48" height="24"/>
      <rect class="tile success" x="560" y="176" width="48" height="24"/>
      <rect class="tile primary" x="560" y="144" width="48" height="24"/>
      <rect class="tile muted" x="672" y="184" width="48" height="24"/>
      <rect class="tile primary" x="672" y="216" width="48" height="24"/>
      <rect class="tile ink" x="672" y="248" width="48" height="24"/>
      <rect class="tile muted" x="800" y="24" width="48" height="24"/>
      <rect class="tile muted" x="856" y="24" width="48" height="24"/>
      <rect class="tile muted" x="800" y="56" width="48" height="24"/>
    </g>
  </svg>
  <div class="name">
    <h1>Portflow</h1>
    <p>Office screens and field screens, one set of tokens.</p>
  </div>
</div>
</body>
</html>
`
