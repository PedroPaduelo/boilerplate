# AppShell

The outermost layout for an application. Provides slots for top navigation, side navigation, banners, and main content. Use it as the root wrapper for every page. It handles responsive mobile navigation and skip-to-content automatically. Configure side nav collapse on SideNav with its collapsible prop.

**Import:** `import {AppShell} from '@astryxdesign/core/AppShell';`

## Best Practices

- **Do:** Choose the right height: use "fill" for dashboards with internal scrolling and "auto" for pages that grow with content.
- **Do:** Set `contentPadding` based on content type: 4 for forms and settings, 0 for tables and dashboards.
- **Don't:** Nest one AppShell inside another; it's the outermost layout frame.
- **Don't:** Use for sub-page layouts; use Layout for content areas within AppShell.

## Props

| Prop             | Type                                                       | Default      | Description                                                                                                                  |
| ---------------- | ---------------------------------------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| `children`       | `ReactNode`                                                | —            | main content area, rendered inside <main>                                                                                    |
| `contentPadding` | `0 \| 0.5 \| 1 \| 1.5 \| 2 \| 3 \| 4 \| 5 \| 6 \| 8 \| 10` | `0`          | main content area padding. 4 (16px) for forms/settings/text, 0 for dashboards/maps/tables. Override per-section via Section. |
| `topNav`         | `ReactNode`                                                | —            | top nav slot, typically TopNav                                                                                               |
| `sideNav`        | `ReactNode`                                                | —            | side nav slot, typically SideNav                                                                                             |
| `mobileNav`      | `ReactNode`                                                | —            | mobile nav config: false \| MobileNavConfig \| ReactNode                                                                     |
| `banner`         | `ReactNode`                                                | —            | slot for system-wide announcements above topNav                                                                              |
| `height`         | `'fill' \| 'auto'`                                         | `'fill'`     | fill=viewport 100dvh w/ independent scroll; auto=content-driven w/ sticky nav                                                |
| `variant`        | `'wash' \| 'surface' \| 'section' \| 'elevated'`           | `'elevated'` | nav bg style: wash=wash bg, surface=surface bg, section=dividers, elevated=wash nav w/ elevated surface content+radius       |
| `xstyle`         | `StyleXStyles`                                             | —            | StyleX layout customization via stylex.create()                                                                              |

## Theming

| Component class            | Preferred data attributes | Props                            | States |
| -------------------------- | ------------------------- | -------------------------------- | ------ |
| `astryx-app-shell`         | `data-variant`            | wash, surface, section, elevated | —      |
| `astryx-app-shell-header`  | `data-variant`            | wash, surface, section, elevated | —      |
| `astryx-app-shell-sidenav` | `data-variant`            | wash, surface, section, elevated | —      |

Override in defineTheme:

```ts
components: {
  'app-shell': {
    base: { /* CSS properties */ },
    'variant:value': { /* variant-specific */ },
  },
  'app-shell-header': {
    base: { /* CSS properties */ },
  },
}
```

Related block templates:

AppShellContentOnly
Minimal shell with no navigation, useful for full-bleed pages, auth screens, or embedded views.
AppShellMobileHookUsage
Custom mobile navigation trigger built with useAppShellMobile. The trigger consumes the surrounding AppShell context instead of rendering its own shell.
AppShellShowcase
A basic app shell with content padding.
AppShellSideNavOnly
App shell with SideNav header providing app identity, no TopNav needed.
AppShellTopNavOnly
Simple layout with TopNav and no side navigation, suitable for landing pages.
AppShellTopNavWithSideNav
The most common layout with TopNav for app identity and SideNav for page-level navigation.
AppShellWithBanner
Full layout with TopNav, SideNav, and a dismissable info banner between the nav and content.
MobileNavToggleBasic
A nav toggle with a custom icon and accessible label instead of the default hamburger. It opens a MobileNav drawer via the AppShell mobile context, which AppShell provides automatically.

---

# SideNav

A sidebar navigation component for organizing application pages with sections, nested items, and icons. Use SideNav as the primary navigation when an app has 5 or more destinations or requires hierarchical grouping.

**Import:** `import {SideNav} from '@astryxdesign/core/SideNav';`

## Anatomy

| Element                | Required | Description                                |
| ---------------------- | -------- | ------------------------------------------ |
| Product icon and name  | No       | Branding area at the top of the nav.       |
| Navigation items       | Yes      | Sections and groups of navigable links.    |
| Collapse/expand toggle | No       | Toggle to collapse or expand the side nav. |

## Best Practices

- **Do:** Use sections to group related navigation items and help users scan for their destination.
- **Do:** Pair outline and filled icon variants so the selected state is visually distinct.
- **Don't:** Include a SideNavHeading when a TopNav is already providing app identity; this duplicates branding.
- **Don't:** Use for filtering content; use tabs or filter buttons instead.

## Props

| Prop          | Type                                                                                                                                                                | Default | Description                                                                                                                                                                                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `header`      | `ReactNode`                                                                                                                                                         | —       | Header area (typically SideNavHeading). Sticky.                                                                                                                                                                                                                   |
| `topContent`  | `ReactNode`                                                                                                                                                         | —       | Content below the header, e.g., a create button.                                                                                                                                                                                                                  |
| `children`    | `ReactNode`                                                                                                                                                         | —       | Navigation sections and items. Scrollable.                                                                                                                                                                                                                        |
| `footer`      | `ReactNode`                                                                                                                                                         | —       | Footer area above the icon bar.                                                                                                                                                                                                                                   |
| `footerIcons` | `ReactNode`                                                                                                                                                         | —       | Footer icon bar.                                                                                                                                                                                                                                                  |
| `collapsible` | `boolean \| { defaultIsCollapsed?: boolean; isCollapsed?: boolean; onCollapsedChange?: (isCollapsed: boolean) => void; hasButton?: boolean; buttonLabel?: string }` | `false` | Enables collapse behavior. true for uncontrolled with default toggle button, or an object for controlled mode and advanced config (defaultIsCollapsed, isCollapsed + onCollapsedChange, hasButton, buttonLabel).                                                  |
| `resizable`   | `boolean \| { defaultWidth?: number; minWidth?: number; maxWidth?: number; autoSaveId?: string; onWidthChange?: (width: number) => void }`                          | `false` | Enables a resize handle at the inline-end edge. true for defaults (260px initial, 180-480px range), or a ResizableConfig object (defaultWidth, minWidth, maxWidth, autoSaveId for localStorage persistence, onWidthChange). The handle is hidden while collapsed. |
| `handleRef`   | `Ref<SideNavImperativeCollapseHandle>`                                                                                                                              | —       | Imperative collapse handle for SideNavCollapseButton instances rendered outside this SideNav. Separate from `ref`, which continues to expose the root HTMLElement.                                                                                                |
| `xstyle`      | `StyleXStyles`                                                                                                                                                      | —       | StyleX styles for layout customization (margins, positioning, sizing). Must be a stylex.create() value: not an inline style object like style={{}}.                                                                                                               |

## Components

### SideNavHeading

See `npx astryx component SideNavHeading` for props and usage.

### SideNavItem

See `npx astryx component SideNavItem` for props and usage.

### SideNavSection

See `npx astryx component SideNavSection` for props and usage.

### SideNavCollapseButton

See `npx astryx component SideNavCollapseButton` for props and usage.

## Theming

| Component class           | Preferred data attributes    | Props | States   |
| ------------------------- | ---------------------------- | ----- | -------- |
| `astryx-side-nav`         | `data-mode`                  | mode  | —        |
| `astryx-side-nav-heading` | —                            | —     | —        |
| `astryx-side-nav-item`    | `data-size`, `data-selected` | size  | selected |
| `astryx-side-nav-section` | —                            | —     | —        |

Override in defineTheme:

```ts
components: {
  'side-nav': {
    base: { /* CSS properties */ },
    'mode:value': { /* variant-specific */ },
  },
  'side-nav-heading': {
    base: { /* CSS properties */ },
  },
}
```

Related block templates:

AppShellShowcase
A basic app shell with content padding.
AppShellSideNavOnly
App shell with SideNav header providing app identity, no TopNav needed.
AppShellTopNavWithSideNav
The most common layout with TopNav for app identity and SideNav for page-level navigation.
AppShellWithBanner
Full layout with TopNav, SideNav, and a dismissable info banner between the nav and content.
MobileNavBasicMobileNav
Mobile navigation drawer with sectioned nav items triggered by a menu button
MobileNavEndSideMobileNav
Navigation drawer that slides in from the right side of the screen
MobileNavShowcase
MobileNavWithoutTitleMobileNav
Mobile navigation drawer without a title header
MobileNavToggleShowcase
Demonstrates MobileNavToggle as a standalone hamburger button for opening the mobile navigation drawer.
NavHeadingMenuShowcase
NavHeadingMenu passed as the menu prop of SideNavHeading, letting the heading act as a product switcher popover trigger.
SideNavEndContent
Side navigation items with badges, counts, and context menus as trailing content.
SideNavNestedItems
Side navigation with collapsible nested items for settings or hierarchical menus.
SideNavShowcase
SideNavWithHeaderMenu
Side navigation with an account switcher dropdown in the header for multi-account apps.
SideNavCollapseButtonBasic
Place a collapse button in the SideNav footer to let users toggle the rail between expanded and collapsed states. Disable the built-in button via collapsible={{hasButton: false}} when positioning it yourself.
SideNavCollapseButtonShowcase
Demonstrates SideNavCollapseButton inside a collapsible SideNav.
SideNavHeadingBasic
A SideNav header with an app icon and a linked title. Pass it to the SideNav header prop to identify the product or workspace at the top of the navigation rail.
SideNavHeadingShowcase
Demonstrates SideNavHeading with an app name, logo icon, superheading, and subheading.
SideNavItemBasic
Navigation links inside a SideNav, each with a label, an icon, and an href. Mark the item for the current page with isSelected.
SideNavItemShowcase
Demonstrates SideNavItem with selected, icon, disabled, and nested states.
SideNavSectionBasic
Group related SideNavItems under titled sections. Use sections to organize longer navigation lists into scannable clusters like Overview and Account.
SideNavSectionShowcase
Demonstrates SideNavSection with titled groups of navigation items.

---

# SideNavItem

Navigation item w/ icon, selected state, optional end content, nesting via children.

**Import:** `import {SideNavItem} from '@astryxdesign/core/SideNav';`

## Props

| Prop           | Type                                                                                                                     | Default | Description                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------------------ | ------- | ---------------------------------------------------------------------------------- |
| `label`        | `string`                                                                                                                 | —       | Item label. **(required)**                                                         |
| `as`           | `LinkComponentType`                                                                                                      | —       | Custom link component.                                                             |
| `icon`         | `IconType`                                                                                                               | —       | Icon displayed in outline (unselected) variant.                                    |
| `selectedIcon` | `IconType`                                                                                                               | —       | Icon displayed when item selected (filled variant).                                |
| `isSelected`   | `boolean`                                                                                                                | `false` | Marks this item as current page.                                                   |
| `isDisabled`   | `boolean`                                                                                                                | `false` | Disabled state.                                                                    |
| `href`         | `string`                                                                                                                 | —       | Navigation URL.                                                                    |
| `onClick`      | `(e: MouseEvent) => void`                                                                                                | —       | Click handler.                                                                     |
| `endContent`   | `ReactNode`                                                                                                              | —       | Right-side content such as badges or counts.                                       |
| `children`     | `ReactNode`                                                                                                              | —       | Sub-items for nesting.                                                             |
| `collapsible`  | `boolean \| { defaultIsCollapsed?: boolean, isCollapsed?: boolean, onCollapsedChange?: (isCollapsed: boolean) => void }` | `false` | Enables collapse for items w/ children. true=uncontrolled, object=controlled mode. |

Related block templates:

MobileNavToggleBasic
A nav toggle with a custom icon and accessible label instead of the default hamburger. It opens a MobileNav drawer via the AppShell mobile context, which AppShell provides automatically.
SideNavCollapseButtonBasic
Place a collapse button in the SideNav footer to let users toggle the rail between expanded and collapsed states. Disable the built-in button via collapsible={{hasButton: false}} when positioning it yourself.
SideNavCollapseButtonShowcase
Demonstrates SideNavCollapseButton inside a collapsible SideNav.
SideNavItemBasic
Navigation links inside a SideNav, each with a label, an icon, and an href. Mark the item for the current page with isSelected.
SideNavItemShowcase
Demonstrates SideNavItem with selected, icon, disabled, and nested states.
SideNavSectionBasic
Group related SideNavItems under titled sections. Use sections to organize longer navigation lists into scannable clusters like Overview and Account.
SideNavSectionShowcase
Demonstrates SideNavSection with titled groups of navigation items.

---

# SideNavSection

Section grouping w/ optional title, subtitle, end content.

**Import:** `import {SideNavSection} from '@astryxdesign/core/SideNav';`

## Props

| Prop             | Type           | Default | Description                                                               |
| ---------------- | -------------- | ------- | ------------------------------------------------------------------------- |
| `title`          | `string`       | —       | Section title. **(required)**                                             |
| `subtitle`       | `string`       | —       | Section subtitle.                                                         |
| `children`       | `ReactNode`    | —       | Section items.                                                            |
| `endContent`     | `ReactNode`    | —       | Right-side content in section header.                                     |
| `isHeaderHidden` | `boolean`      | `false` | Visually hides section header while keeping accessible to screen readers. |
| `xstyle`         | `StyleXStyles` | —       | StyleX styles for layout customization.                                   |

Related block templates:

MobileNavToggleBasic
A nav toggle with a custom icon and accessible label instead of the default hamburger. It opens a MobileNav drawer via the AppShell mobile context, which AppShell provides automatically.
SideNavCollapseButtonShowcase
Demonstrates SideNavCollapseButton inside a collapsible SideNav.
SideNavItemShowcase
Demonstrates SideNavItem with selected, icon, disabled, and nested states.
SideNavSectionBasic
Group related SideNavItems under titled sections. Use sections to organize longer navigation lists into scannable clusters like Overview and Account.
SideNavSectionShowcase
Demonstrates SideNavSection with titled groups of navigation items.

---

# SideNavHeading

Product/suite/account heading w/ smart interaction boundary logic for links + menu popover.

**Import:** `import {SideNavHeading} from '@astryxdesign/core/SideNav';`

## Props

| Prop               | Type        | Default | Description                                                                                                    |
| ------------------ | ----------- | ------- | -------------------------------------------------------------------------------------------------------------- |
| `heading`          | `string`    | —       | Product/app name. **(required)**                                                                               |
| `icon`             | `ReactNode` | —       | Product/app icon.                                                                                              |
| `headingHref`      | `string`    | —       | Link for heading.                                                                                              |
| `superheading`     | `string`    | —       | Text above heading.                                                                                            |
| `superheadingHref` | `string`    | —       | Link for superheading.                                                                                         |
| `subheading`       | `string`    | —       | Text below heading.                                                                                            |
| `subheadingHref`   | `string`    | —       | Link for subheading.                                                                                           |
| `menu`             | `ReactNode` | —       | Menu content rendered inside popover.                                                                          |
| `headerEndContent` | `ReactNode` | —       | Content at trailing edge of heading row. For badges, status indicators, action buttons. Hidden when collapsed. |

Related block templates:

NavHeadingMenuShowcase
NavHeadingMenu passed as the menu prop of SideNavHeading, letting the heading act as a product switcher popover trigger.
SideNavHeadingBasic
A SideNav header with an app icon and a linked title. Pass it to the SideNav header prop to identify the product or workspace at the top of the navigation rail.
SideNavHeadingShowcase
Demonstrates SideNavHeading with an app name, logo icon, superheading, and subheading.

---

# TopNav

TopNav is a horizontal navigation bar for product-level navigation in application headers. Use TopNav for 5 or fewer always-visible navigation items, or minimal navigation paired with search and controls. For complex navigation hierarchies, use a sidebar; to filter content, use tabs or filter buttons instead.

**Import:** `import {TopNav} from '@astryxdesign/core/TopNav';`

## Anatomy

| Element               | Required | Description                                                            |
| --------------------- | -------- | ---------------------------------------------------------------------- |
| Product icon and name | Yes      | Identifies the product in the navigation bar.                          |
| Navigation items      | Yes      | Primary links for product-level destinations.                          |
| More menu             | No       | Overflow menu for additional navigation items.                         |
| Flex area             | No       | Flexible region for search, primary action buttons, or other controls. |

## Best Practices

- **Do:** Include a product logo and name in the heading slot to clearly identify the application.
- **Do:** Limit primary navigation items to 5 or fewer for quick scanning and minimal cognitive load.
- **Don't:** Avoid using TopNav to filter page content; use Tabs or filter controls instead.
- **Don't:** Avoid deeply nested navigation hierarchies; keep menus to one level of depth.

## Props

| Prop            | Type           | Default            | Description                                                                                                                                                                           |
| --------------- | -------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `heading`       | `ReactNode`    | —                  | Heading slot content (logo, brand): positioned at the left edge of the nav bar.                                                                                                       |
| `startContent`  | `ReactNode`    | —                  | Start content slot for navigation items or breadcrumbs: positioned after the heading, left-aligned.                                                                                   |
| `children`      | `ReactNode`    | —                  | Alias for startContent. Prefer startContent when composing with heading, centerContent, or endContent; children keeps the common React nav-item pattern from silently dropping items. |
| `centerContent` | `ReactNode`    | —                  | Center content slot (tabs, search bar, primary navigation): when provided, switches the layout to a three-column CSS grid for true horizontal centering.                              |
| `endContent`    | `ReactNode`    | —                  | End content slot for search, icons, or user profile: positioned at the right edge.                                                                                                    |
| `label`         | `string`       | `'Top navigation'` | Accessible label for the navigation landmark, applied as aria-label on the <nav> element.                                                                                             |
| `xstyle`        | `StyleXStyles` | —                  | StyleX styles for layout customization (margins, positioning, sizing). Must be a stylex.create() value: not an inline style object like style={{}}.                                   |

## Components

### TopNavHeading

See `npx astryx component TopNavHeading` for props and usage.

### TopNavItem

See `npx astryx component TopNavItem` for props and usage.

### TopNavMenu

See `npx astryx component TopNavMenu` for props and usage.

### TopNavMegaMenu

See `npx astryx component TopNavMegaMenu` for props and usage.

### TopNavMegaMenuItem

See `npx astryx component TopNavMegaMenuItem` for props and usage.

### TopNavMegaMenuFeaturedCard

See `npx astryx component TopNavMegaMenuFeaturedCard` for props and usage.

## Theming

| Component class                          | Preferred data attributes    | Props | States         |
| ---------------------------------------- | ---------------------------- | ----- | -------------- |
| `astryx-top-nav`                         | `data-mode`                  | —     | mode           |
| `astryx-top-nav-item`                    | `data-mode`, `data-selected` | —     | mode, selected |
| `astryx-top-nav-heading`                 | —                            | —     | —              |
| `astryx-top-nav-mega-menu`               | `data-mode`                  | —     | mode           |
| `astryx-top-nav-mega-menu-item`          | `data-mode`                  | —     | mode           |
| `astryx-top-nav-mega-menu-featured-card` | —                            | —     | —              |
| `astryx-top-nav-menu`                    | —                            | —     | —              |

Override in defineTheme:

```ts
components: {
  'top-nav': {
    base: { /* CSS properties */ },
    'mode': { /* state-specific */ },
  },
  'top-nav-item': {
    base: { /* CSS properties */ },
    'mode': { /* state-specific */ },
  },
}
```

Related block templates:

AppShellTopNavOnly
Simple layout with TopNav and no side navigation, suitable for landing pages.
AppShellTopNavWithSideNav
The most common layout with TopNav for app identity and SideNav for page-level navigation.
AppShellWithBanner
Full layout with TopNav, SideNav, and a dismissable info banner between the nav and content.
TopNavCenteredNavigation
Navigation layout with center-aligned nav items flanked by a logo heading and end actions.
TopNavEnterpriseDashboard
Full-featured navigation bar with icon-labeled nav items, search, notifications, and a primary CTA.
TopNavHoverMenu
Navigation bar with a hover-triggered dropdown menu showing product items with icons and descriptions.
TopNavMegaMenu
Marketing-style navigation with a full-width mega menu featuring product items and a promotional featured card.
TopNavMultipleDropdowns
Navigation bar with multiple hover-triggered dropdown menus that auto-close when switching between them.
TopNavShowcase
TopNavWithLogo
Navigation bar with a branded logo icon, heading link, nav items, and a profile action.
TopNavHeadingBasic
A product heading with a logo inside a TopNav, linked to the home page. Use as the leading brand element of a top navigation bar.
TopNavHeadingShowcase
Demonstrates TopNavHeading with a logo and text, both as a plain display and as a clickable link.
TopNavItemBasic
Navigation links inside a TopNav with one item marked as selected. Use for top-level pages of an application.
TopNavItemShowcase
Demonstrates TopNavItem with selected, icon, disabled, and default states.
TopNavMegaMenuBasic
A mega menu trigger inside a TopNav that opens a panel of rich link items. Use when a navigation section has multiple destinations worth describing.
TopNavMegaMenuShowcase
Demonstrates TopNavMegaMenu with items and a featured card in the mega menu panel.
TopNavMegaMenuFeaturedCardShowcase
Demonstrates TopNavMegaMenuFeaturedCard with a title, description, and CTA link inside a mega menu.
TopNavMegaMenuItemShowcase
Demonstrates TopNavMegaMenuItem with icons, titles, and descriptions inside a mega menu.
TopNavMenuBasic
A dropdown menu inside a TopNav built from an items array with icons and descriptions. Use to group related destinations under a single trigger.
TopNavMenuShowcase
Demonstrates TopNavMenu with a hover-triggered dropdown containing items with icons and descriptions.

---

# Button

Button triggers an action when clicked. Use for form submissions, confirmations, navigation, or any interaction needing a clear CTA.

**Import:** `import {Button} from '@astryxdesign/core/Button';`

## Anatomy

| Element     | Required | Description                                                                            |
| ----------- | -------- | -------------------------------------------------------------------------------------- |
| Icon        | No       | A leading icon that reinforces the label, like a trash icon on a Delete button.        |
| Label       | Yes      | The visible text describing the action. Also used as the accessible name.              |
| End content | No       | A trailing badge or icon after the label, like a notification count or dropdown arrow. |
| Spinner     | No       | Replaces the icon during loading to show the action is in progress.                    |

## Best Practices

- **Do:** Primary for the single most important action. Secondary or ghost for the rest.
- **Do:** Labels that describe the action: "Save changes" not "OK" or "Click here".
- **Do:** Show loading state for async actions so the user knows it is working.
- **Do:** Icon-only buttons need a label for screen readers and a tooltip for sighted users.
- **Do:** For dedicated icon-only buttons, use IconButton from @astryxdesign/core/IconButton. Separate component, not exported from @astryxdesign/core/Button.
- **Don't:** Multiple primary buttons in one view; dilutes hierarchy.
- **Don't:** Destructive without confirmation for irreversible actions.
- **Don't:** Button for navigation; use a link if it only takes the user to another page.

## Props

| Prop              | Type                                                   | Default       | Description                                                                                                                                                                                                                             |
| ----------------- | ------------------------------------------------------ | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `label`           | `string`                                               | —             | accessible label; visible text by default, aria-label when isIconOnly **(required)**                                                                                                                                                    |
| `variant`         | `'primary' \| 'secondary' \| 'ghost' \| 'destructive'` | `'secondary'` | visual style variant                                                                                                                                                                                                                    |
| `size`            | `'sm' \| 'md' \| 'lg'`                                 | `'md'`        | size variant                                                                                                                                                                                                                            |
| `type`            | `'button' \| 'submit' \| 'reset'`                      | `'button'`    | HTML button type; defaults to "button"                                                                                                                                                                                                  |
| `name`            | `string`                                               | —             | HTML name for form submission                                                                                                                                                                                                           |
| `value`           | `string \| number \| readonly string[]`                | —             | HTML value for form submission                                                                                                                                                                                                          |
| `form`            | `string`                                               | —             | associates button with form element by ID                                                                                                                                                                                               |
| `isLoading`       | `boolean`                                              | `false`       | shows spinner+disables interaction; announces via live region                                                                                                                                                                           |
| `isInterruptible` | `boolean`                                              | `false`       | Keep the button clickable while a clickAction is pending: the spinner and aria-busy still show, but the button is not disabled and the action is not deduped, so a re-click lands and interrupts the in-flight action with a fresh one. |
| `isDisabled`      | `boolean`                                              | `false`       | disables button; uses aria-disabled when tooltip present                                                                                                                                                                                |
| `icon`            | `ReactNode`                                            | —             | icon element rendered before label text                                                                                                                                                                                                 |
| `isIconOnly`      | `boolean`                                              | `false`       | when true, renders square icon-only button; label becomes aria-label                                                                                                                                                                    |
| `width`           | `SizeValue`                                            | —             | Width of button. Numbers=pixels, strings=as-is (e.g. '100%' for full-width).                                                                                                                                                            |
| `children`        | `ReactNode`                                            | —             | optional visible override; label is still required for a11y. Prefer <Button label="Save" /> over using children                                                                                                                         |
| `endContent`      | `ReactElement<IconProps> \| ReactElement<BadgeProps>`  | —             | trailing icon/badge after label; ignored when isIconOnly; color inherited                                                                                                                                                               |
| `tooltip`         | `string`                                               | —             | tooltip on hover                                                                                                                                                                                                                        |
| `onClick`         | `(e: MouseEvent) => void`                              | —             | standard click handler; fires before clickAction                                                                                                                                                                                        |
| `clickAction`     | `(e: MouseEvent) => void \| Promise<void>`             | —             | async click handler; shows loading while promise pending                                                                                                                                                                                |

## Theming

| Component class | Preferred data attributes   | Props                                  | States |
| --------------- | --------------------------- | -------------------------------------- | ------ |
| `astryx-button` | `data-size`, `data-variant` | primary, secondary, ghost, destructive | —      |

Override in defineTheme:

```ts
components: {
  'button': {
    base: { /* CSS properties */ },
    'size:value': { /* variant-specific */ },
  },
}
```

**Themeable CSS variables** — additional properties that can be overridden in `defineTheme` component overrides.

| CSS Variable                | Default       | Description                        |
| --------------------------- | ------------- | ---------------------------------- |
| `--button-press-scale`      | `scale(0.98)` | Active press transform             |
| `--button-disabled-opacity` | `0.5`         | Opacity when disabled              |
| `--button-focus-offset`     | `3px`         | Focus ring outline offset          |
| `--button-icon-only-aspect` | `1 / 1`       | Aspect ratio for icon-only buttons |

Some properties are set via standard CSS in component overrides:

```ts
components: {
  button: {
    base: {
      borderRadius: '...',
    },
  },
}
```

Related block templates:

AppShellMobileHookUsage
Custom mobile navigation trigger built with useAppShellMobile. The trigger consumes the surrounding AppShell context instead of rendering its own shell.
BannerCollapsibleContent
Combine an action button, dismiss control, and expandable detail area in one banner. Use for complex notifications like config changes or deployment summaries.
BannerSectionVariant
A full-width banner with no border radius for page-level notifications. Use at the top of a page for site-wide announcements or maintenance alerts.
BannerWithActionButton
Add a button to a banner so the user can act on the message. Use for trial expirations, payment failures, or anything that needs a response.
ButtonShowcase
All four button variants side by side: primary, secondary, ghost, and destructive. A quick visual reference for choosing the right variant.
ButtonSizeVariants
Small, medium, and large buttons side by side. Use small in dense UIs like toolbars, medium for most cases, and large for prominent CTAs.
ButtonVariants
All 4 button variants in default, disabled, and loading states. Use primary for the main action, secondary for most others, ghost for low-emphasis, and destructive for dangerous actions.
ButtonWithEndSlot
Buttons with a trailing badge showing a count or status. Use for notification counts, unread messages, or any button that needs a visual indicator.
ButtonWithIcon
Buttons with a leading icon that reinforces the label. Use when the icon helps the user identify the action faster, like a plus for "New" or a trash can for "Delete".
ButtonGroupBasic
Three related actions joined into a single connected control. Provide a group label for accessibility and keep all buttons the same variant so they read as one unit.
ButtonGroupShowcase
CardWithInnerLayout
A card with a structured header, content area, and footer with action buttons. Use for forms, dialogs, or settings panels that need clear sections. Pair Card with Layout to get automatic dividers between header, content, and footer. The footer aligns actions to the right by default.
ClickableCardWithNestedButton
A product card that navigates on click but has an independent "Add to cart" button inside.
ChatComposerFooterActions
Chat composer with dropdown menus for a model selector and settings in the footer, and a mic button in the send actions slot.
ChatComposerFullFeatured
Chat composer with all slots populated: collapsible attachment drawer, header actions, context progress bar, footer dropdown menus, and mic button. Shows the maximum composer configuration.
ChatComposerDrawerShowcase
Composer drawer with file tokens, a collapsible toggle, and header actions. Use as a starting point for any chat composer with attachments.
ChatComposerDrawerWithProgress
Drawer paired with a context progress bar in the header. Show context window usage when attachments consume part of the available token budget.
ChatMessageBubbleMetadata
Bubbles with name and metadata slots aligned to bubble padding. Put name on the first bubble and metadata on the last bubble in a message.
ChatMessageMetadataFooter
Assistant message with footer actions: copy, retry, thumbs up/down, and model label. Use for AI responses that need feedback or utility controls.
ChatMessageMetadataShowcase
Three-message conversation showcasing error status with retry, delivery status, and full footer actions with model label.
CollapsibleHookUsage
Custom disclosure UI built directly with useCollapsible for headless open/close state.
DialogConfirmationDialog
Asks the user to confirm a destructive action before it happens. Use before deleting projects, removing team members, revoking API keys, or any irreversible operation.
DialogFormDialog
Collects user input without navigating away from the page. Uses purpose="form" so clicking the backdrop won't close it. Use for editing profiles, creating items, or updating settings inline.
DialogFullscreenDialog
Takes over the entire viewport for content that needs maximum space. Use for documentation viewers, rich text editors, multi-step wizards, or media previews where the standard dialog width is too narrow.
DialogScrollingContent
Constrains the dialog height and scrolls the body when content overflows. Use for terms and conditions, license agreements, changelogs, or any long-form content the user needs to review before accepting.
DialogWithSubtitle
Cannot be dismissed by Escape or backdrop click; the user must explicitly choose an action. Uses purpose="required". Use for ownership transfers, legal acknowledgements, or critical decisions where skipping is not an option.
EmptyStateActions
Full empty state with icon, message, and action buttons. Use when a search returns no results, a filter clears all items, or a list has been emptied. The buttons give the user a way forward: go back, clear filters, or try a different query.
EmptyStateCompact
Smaller empty state with reduced spacing for constrained areas. Use inside sidebar panels, card widgets, or notification drawers where a full-size empty state would overwhelm the layout.
EmptyStateContainer
Empty state wrapped in a Card for first-time setup or onboarding. Use when the user has not created any items yet, like a project list, team roster, or dashboard widget that will fill with data once they take action.
EmptyStateShowcase
A no-results empty state with an icon, descriptive message, and a call-to-action button.
useKeyboardHintHookUsage
Toolbar shows an ephemeral "← → to navigate" hint on first keyboard focus via useKeyboardHint, teaching sighted keyboard users that arrows move within the group.
HoverCardHookUsage
Custom profile preview using useHoverCard with direct trigger and render control.
HoverCardProfileHoverCard
Shows a user profile summary on hover with name, role, and bio. Use on usernames, avatars, or mentions to let users preview a profile without navigating away.
HoverCardShowcase
A hover card that shows a user profile preview when hovering over a trigger button. Starts open for preview.
LayerHookUsage
Low-level anchored overlay rendered with useLayer and a custom surface.
LayoutBasicCardLayout
A card layout with header, scrollable content area, and footer with action buttons.
LayoutContentWidth
A layout using contentWidth to constrain and center content while keeping dividers full-bleed.
LayoutFullBleedContent
A layout where content extends edge-to-edge with zero padding, ideal for tables or images.
LayoutShowcase
LayoutSidebarLayout
A settings page layout with a navigation sidebar panel, content area, header, and footer.
LayoutFooterActions
A fixed footer with end-aligned action buttons below scrollable content. Use LayoutFooter inside Layout for persistent actions like Save and Cancel.
LayoutHeaderWithActions
A fixed page header with a title and a primary action, above scrollable content. Use LayoutHeader inside Layout for persistent page-level headers.
MediaThemeImageOverlay
A common image card pattern: place text and actions over a dark gradient and wrap the overlay content in MediaTheme mode="dark".
MediaThemeLightScrim
A light scrim over an image. Use MediaTheme mode="light" so text and ghost buttons use dark-on-light tokens.
MediaThemeShowcase
A compact media overlay showing MediaTheme adapting text, icons, badges, and button variants over an image-backed dark surface.
MobileNavBasicMobileNav
Mobile navigation drawer with sectioned nav items triggered by a menu button
MobileNavEndSideMobileNav
Navigation drawer that slides in from the right side of the screen
MobileNavShowcase
MobileNavWithoutTitleMobileNav
Mobile navigation drawer without a title header
MobileNavToggleShowcase
Demonstrates MobileNavToggle as a standalone hamburger button for opening the mobile navigation drawer.
OutlineControlled
Drive the active section yourself with activeId and onActiveIdChange. Providing activeId disables the built-in scroll-spy so your own logic owns the highlight.
OverflowListCollapseFromStartList
Overflow list that hides items from the start, keeping the latest visible
OverflowListOverflowDropdownActions
Action toolbar that collapses overflow buttons into a dropdown menu
OverflowListShowcase
A list of buttons that collapses overflowing items into a +N indicator.
OverlayHoverReveal
Reveals an overlay action on hover or keyboard focus. Use when actions should stay visually quiet until the media receives attention.
OverlayShowcase
A media card with an always-visible scrim and centered action content.
PopoverConfirmAction
Inline confirmation popover for destructive actions with delete and cancel buttons.
PopoverFilterPanel
Popover with checkbox filters and apply/reset actions.
PopoverHookUsage
Custom quick-actions popover using usePopover for trigger refs, ARIA attributes, and focus trapping.
PopoverKeyboardShortcuts
Popover displaying a list of keyboard shortcuts with key and description pairs.
PopoverSettingsPanel
Popover with toggle switches for managing user preferences like notifications, dark mode, and sounds.
PopoverShowcase
ResizableSidebar
A collapsible sidebar with snap points, driven by useResizable. Dragging snaps to preset widths, dragging past the minimum collapses the panel, and the expand method restores it programmatically.
SectionWashHighlight
A default section stacked with a full-width muted section. Shows how muted draws attention to a specific region like an upgrade prompt or banner.
StackAlignment
Buttons positioned at the start, center, and end of a row.
StackFillItem
An avatar, text, and button in a row; the text stretches to fill the available space.
TabListTabsWithActions
Page header pattern with tabs on the left and action buttons pushed to the right. When hasDivider is true, match the Button size to the TabList size so the tabs and actions align to a shared baseline above the divider.
ThemeApply
Wrap a subtree in Theme to apply a theme to every child component in that region.
ThemeNested
Nested Theme providers let a local region use a different theme without affecting the rest of the page.
ThemeShowcase
Two visually distinct theme providers wrapping identical content to show how Theme changes the visual treatment of child components.
ThemeSwitcher
Use state to switch the theme object passed to Theme and preview a different visual treatment.
ToastAction
Persistent toasts with a trailing button or link so the user can act on the notification, like undoing a delete or viewing a report.
ToastDeduplication
Prevent duplicate toasts with uniqueID. Use ignore to keep the first toast, or overwrite to replace it with updated content like a progress percentage.
ToastDismiss
Show a persistent toast and dismiss it programmatically using the function returned by useToast. Use for long-running operations that need manual cleanup.
ToastShowcase
Imperative toast notifications triggered with useToast and rendered in the toast viewport.
ToastStacking
Multiple toasts stacking vertically with smooth enter and exit animations. Click repeatedly to see how toasts queue and dismiss.
ToastTypes
Info and error toast variants side by side. Info toasts auto-dismiss after 5 seconds, error toasts persist until the user dismisses them.
TokenizerEndContent
Tokenizer with an action button in the end slot. Use for inline actions like applying selections alongside the input.
ToolbarBulkActions
A compact toolbar with the muted variant for showing bulk selection actions. Use when the user selects multiple items in a list or table and needs quick access to batch operations.
ToolbarCardHeader
A toolbar as a card header with a left-aligned title and icon actions on the right. Use Toolbar instead of LayoutHeader when your card header has interactive actions; Toolbar adds start/end slot layout, keyboard navigation, and automatic size cascading. If the header is just a title with no actions, a LayoutHeader or Section is enough.
ToolbarSizes
Small, medium, and large toolbars side by side. The size prop cascades to child buttons and inputs automatically. Use small in dense UIs like cards, medium for most cases, and large for spacious layouts.
ToolbarThreeSlot
A toolbar with start, center, and end content using the three-column grid layout. Use when you need a centered title or heading with navigation and actions on either side.
ToolbarWithTabs
A toolbar with tabs in the start slot and an action button at the end. Use as a card or section header when content is split into tabs with a primary action alongside.
TooltipActionBarTooltips
Tooltips on an action button bar with contextual descriptions.
TooltipHookUsage
Tooltip using the useTooltip hook for programmatic control.
TooltipShowcase
TopNavCenteredNavigation
Navigation layout with center-aligned nav items flanked by a logo heading and end actions.
TopNavEnterpriseDashboard
Full-featured navigation bar with icon-labeled nav items, search, notifications, and a primary CTA.
TopNavHoverMenu
Navigation bar with a hover-triggered dropdown menu showing product items with icons and descriptions.
TopNavMegaMenu
Marketing-style navigation with a full-width mega menu featuring product items and a promotional featured card.
TopNavShowcase
TopNavWithLogo
Navigation bar with a branded logo icon, heading link, nav items, and a profile action.
VisuallyHiddenLiveRegion
A polite aria-live region announces visual-only state changes to assistive technology.

---

# IconButton

Button showing only an icon, no visible text. Use in toolbars, table rows, compact UI where space is tight + icon universally understood.

**Import:** `import {IconButton} from '@astryxdesign/core/IconButton';`

## Best Practices

- **Do:** Make aria-label specific: trash icon labeled "Delete conversation" > just "Delete" for screen readers.
- **Do:** Add tooltip: even gear icon can mean Settings/Preferences/Configure.
- **Do:** Use ghost in toolbars + dense areas to reduce visual clutter.
- **Don't:** Use IconButton if action isn't obvious from icon alone; use Button w/ text instead.
- **Don't:** Skip tooltip: label only reaches screen readers; sighted users need hover hint.

## Props

| Prop          | Type                                                   | Default       | Description                                                                       |
| ------------- | ------------------------------------------------------ | ------------- | --------------------------------------------------------------------------------- |
| `label`       | `string`                                               | —             | accessible label; used as aria-label, not rendered as visible text **(required)** |
| `icon`        | `ReactNode`                                            | —             | icon element rendered inside button **(required)**                                |
| `variant`     | `'primary' \| 'secondary' \| 'ghost' \| 'destructive'` | `'secondary'` | visual style variant                                                              |
| `size`        | `'sm' \| 'md' \| 'lg'`                                 | `'md'`        | size variant                                                                      |
| `isLoading`   | `boolean`                                              | `false`       | shows loading spinner + disables interaction                                      |
| `isDisabled`  | `boolean`                                              | `false`       | disables button                                                                   |
| `tooltip`     | `string`                                               | —             | tooltip text shown on hover                                                       |
| `onClick`     | `(e: MouseEvent) => void`                              | —             | standard click handler                                                            |
| `clickAction` | `(e: MouseEvent) => void \| Promise<void>`             | —             | async click handler w/ automatic loading state                                    |

Related block templates:

ButtonGroupShowcase
CenterHorizontal
An editor toolbar with a document title on the left and formatting actions on the right. This shows axis="horizontal", centering in one direction only. Use when content needs to be horizontally centered while other elements are positioned independently around it.
IconButtonActionBar
Row of ghost icon buttons for a compact action toolbar
IconButtonLoadingToggle
Icon buttons that show a loading spinner on click for async feedback
IconButtonShowcase
An icon button with a wrench icon.
IconButtonTooltipIconButton
Icon buttons with tooltips that explain each action on hover
VisuallyHiddenShowcase

---

# Card

Card is for discrete items with clear interaction boundaries (one profile, one notification, one product). Cards are NOT the default. Spacing and alignment create visual grouping without borders. Ask: "could I reorder or remove this independently?" If no, don't use a card.

**Import:** `import {Card} from '@astryxdesign/core/Card';`

## Anatomy

| Element   | Required | Description                                                                         |
| --------- | -------- | ----------------------------------------------------------------------------------- |
| Container | Yes      | The outer box with border, background, border-radius, and padding.                  |
| Content   | Yes      | Any children rendered inside the card. Often a stack of heading, text, and actions. |

## Best Practices

- **Do:** Ask "could I reorder/remove this independently?" If yes, it's a card. If no, it's just a page section: use heading + Stack or Section.
- **Do:** Use cards for discrete items: one profile, one notification, one metric, one product in a grid. Each card = one "thing" w/ clear interaction boundaries.
- **Do:** Spacing + alignment alone create visual grouping. Not everything needs a container; try removing the card; if grouping still reads from whitespace + typography, skip it.
- **Do:** Keep padding consistent across sibling cards so they align visually in a grid or list.
- **Do:** Pair a card w/ Layout when you need a structured header, scrollable content, and footer with actions.
- **Don't:** Default to cards for grouping. Heading + Stack w/ proper spacing creates hierarchy w/o borders everywhere. Cards are the exception, not the default.
- **Don't:** Wrap page sections in cards. "General Settings", "Notification Preferences", form groups are page regions; use Section or heading + stack.
- **Don't:** Create identical card grids (icon + heading + text, repeated). Vary the layout or question whether cards are needed at all.
- **Don't:** Nest cards inside other cards; flatten the hierarchy or use spacing + dividers instead.
- **Don't:** Use color variants for status; use Banner or Badge for that instead. Color cards are for categorization.

## Props

| Prop        | Type                                                                                                                                              | Default     | Description                                                                                                                                                                                                             |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `width`     | `SizeValue`                                                                                                                                       | —           | card width (number=px, string=as-is)                                                                                                                                                                                    |
| `height`    | `SizeValue`                                                                                                                                       | —           | card height (number=px, string=as-is)                                                                                                                                                                                   |
| `maxWidth`  | `SizeValue`                                                                                                                                       | —           | max card width                                                                                                                                                                                                          |
| `minHeight` | `SizeValue`                                                                                                                                       | —           | min card height                                                                                                                                                                                                         |
| `children`  | `ReactNode`                                                                                                                                       | —           | content inside card                                                                                                                                                                                                     |
| `padding`   | `0 \| 0.5 \| 1 \| 1.5 \| 2 \| 3 \| 4 \| 5 \| 6 \| 8 \| 10`                                                                                        | `4`         | internal padding via spacing scale                                                                                                                                                                                      |
| `variant`   | `'default' \| 'transparent' \| 'muted' \| 'blue' \| 'cyan' \| 'gray' \| 'green' \| 'orange' \| 'pink' \| 'purple' \| 'red' \| 'teal' \| 'yellow'` | `'default'` | background color variant; `default` = standard card bg, `transparent` = no background at all, `muted` = muted bg for de-emphasised cards; non-semantic variants use the corresponding `--color-background-<name>` token |

## Theming

| Component class | Preferred data attributes | Props                                                                                         | States |
| --------------- | ------------------------- | --------------------------------------------------------------------------------------------- | ------ |
| `astryx-card`   | `data-variant`            | default, transparent, muted, blue, cyan, gray, green, orange, pink, purple, red, teal, yellow | —      |

Override in defineTheme:

```ts
components: {
  'card': {
    base: { /* CSS properties */ },
    'variant:value': { /* variant-specific */ },
  },
}
```

Some properties are set via standard CSS in component overrides:

```ts
components: {
  card: {
    base: {
      borderRadius: '...',
      padding: '...',  // expands to container layout tokens
    },
  },
}
```

Related block templates:

BlockquoteTestimonials
Multiple quotes arranged in a card grid for a testimonials section. Combine with Card and Grid to create social-proof layouts.
CardCallout
Muted-variant cards for tips, notes, or supplementary information. Use when content should be visually distinct but not prominent. The muted variant uses a wash background instead of the elevated default, making it feel recessed rather than raised. Works well in sidebars, help panels, or inline callouts.
CardShowcase
A card with a heading and body text showing the default container style.
CardVariants
Default, muted, and color variants side by side. Use color variants to categorize cards visually, like team colors, project tags, or content types. Each color uses the corresponding background token from the theme, so they adapt to light and dark mode automatically.
CardWithInnerLayout
A card with a structured header, content area, and footer with action buttons. Use for forms, dialogs, or settings panels that need clear sections. Pair Card with Layout to get automatic dividers between header, content, and footer. The footer aligns actions to the right by default.
CardWithSimpleContent
A card with a heading and body text. Use for summaries, descriptions, or any grouped content that needs visual separation from the page. The card handles its own border, background, and padding; just pass your content as children. Set a width to constrain it, or leave it to fill the parent.
CarouselCards
A horizontally scrollable row of cards with snap scrolling enabled. Use for feature grids, product lists, or any set of cards that overflows the available width. The carousel adds fade edges and navigation buttons automatically.
CarouselShowcase
A horizontal carousel of cards with scroll-snap and navigation buttons. Scroll or click the arrows to browse.
CarouselSnap
Scroll-snap carousel with navigation buttons and team member cards. Each card snaps to the start edge on scroll. Use when items should be viewed one at a time rather than as a continuous strip.
CenterHorizontal
An editor toolbar with a document title on the left and formatting actions on the right. This shows axis="horizontal", centering in one direction only. Use when content needs to be horizontally centered while other elements are positioned independently around it.
CenterInsideACard
An empty state with an icon, heading, and description centered both vertically and horizontally inside a card. This is the most common use of Center: placing content in the middle of a fixed-height area like a panel, card, or content region. The height prop defines the centering space.
CollapsibleControlledAccordion
Manage the open section from parent state. Use when the open state needs to sync with a URL param, form, or external control.
CollapsibleHookUsage
Custom disclosure UI built directly with useCollapsible for headless open/close state.
CollapsibleMultipleAccordion
Several sections open at once. Use when users need to compare content across sections, like feature lists or pricing tiers.
CollapsibleShowcase
An accordion group with three collapsible sections in single mode: opening one closes the others.
DialogFullscreenDialog
Takes over the entire viewport for content that needs maximum space. Use for documentation viewers, rich text editors, multi-step wizards, or media previews where the standard dialog width is too narrow.
DividerFullBleed
Divider that extends past container padding to span the full width. Use inside cards or panels when you want a clean edge-to-edge separation, like between an order summary and total.
DividerVariants
Subtle, labeled, and strong dividers in a single card. Use subtle between related sections, labeled for alternatives like "or", and strong for high-contrast boundaries.
DividerVertical
Vertical dividers separating side-by-side metrics. Use between stat cards, toolbar groups, or any horizontal layout where you need a visual boundary between sections.
EmptyStateContainer
Empty state wrapped in a Card for first-time setup or onboarding. Use when the user has not created any items yet, like a project list, team roster, or dashboard widget that will fill with data once they take action.
GridDashboardLayout
Dashboard layout with mixed-size widgets and a full-width summary row
GridGalleryExample
Card gallery with responsive columns that maintain consistent widths
GridResponsiveAutoFit
Responsive grid where cards stretch to fill remaining space
GridShowcase
GridWithGridSpan
Grid with featured items spanning multiple columns and rows
GridSpanColumns
Grid items spanning two of three columns. Wrap a grid child in GridSpan to make it occupy multiple columns for asymmetric layouts.
useKeyboardHintHookUsage
Toolbar shows an ephemeral "← → to navigate" hint on first keyboard focus via useKeyboardHint, teaching sighted keyboard users that arrows move within the group.
useStreamingTextHookUsage
Smooth bursty generated text into a steady reveal with useStreamingText.
KbdMenuShortcuts
Menu-style list pairing action labels with their keyboard shortcuts
LayerHookUsage
Low-level anchored overlay rendered with useLayer and a custom surface.
LayoutBasicCardLayout
A card layout with header, scrollable content area, and footer with action buttons.
LayoutContentOnlyLayout
A minimal layout with just a content area inside a card, without header or footer.
LayoutDualPanelLayout
A file browser style layout with start panel for folders, main content for files, and end panel for details.
LayoutFullBleedContent
A layout where content extends edge-to-edge with zero padding, ideal for tables or images.
LayoutSidebarLayout
A settings page layout with a navigation sidebar panel, content area, header, and footer.
LayoutContentBasic
A scrollable main content area below a fixed header. Use LayoutContent inside Layout to get automatic padding and scroll containment for the primary content.
LayoutFooterActions
A fixed footer with end-aligned action buttons below scrollable content. Use LayoutFooter inside Layout for persistent actions like Save and Cancel.
LayoutHeaderWithActions
A fixed page header with a title and a primary action, above scrollable content. Use LayoutHeader inside Layout for persistent page-level headers.
LayoutPanelNavigation
A fixed-width side panel holding a navigation list next to the main content. Use LayoutPanel in the start or end slot of Layout for sidebars.
OverflowListCollapseFromStartList
Overflow list that hides items from the start, keeping the latest visible
OverflowListOverflowBadges
Resizable row of badges that collapses into a count badge on overflow
OverflowListOverflowDropdownActions
Action toolbar that collapses overflow buttons into a dropdown menu
PaginationDotsCarousel
A review carousel using dot pagination to step through testimonial cards. Use the dots variant for carousels, galleries, and any paged content where the total is small and visible position matters more than a page number.
ResizableShowcase
Horizontal resizable split with a draggable handle between two panels.
ResizableSidebar
A collapsible sidebar with snap points, driven by useResizable. Dragging snaps to preset widths, dragging past the minimum collapses the panel, and the expand method restores it programmatically.
SkeletonCardSkeleton
Card skeleton with avatar, name, and content lines.
StackAlignment
Buttons positioned at the start, center, and end of a row.
StackItemFill
A static-width item next to one that fills the remaining space. Wrap stack children in StackItem when an item needs explicit sizing control.
SwitchSettingsPanel
Settings panel with spread-spaced switches in a card.
TableInCard
Table composed inside a card with a heading, demonstrating container bleed alignment.
TableShowcase
Data-driven table with proportional and pixel column widths and hover highlighting.
ThemeApply
Wrap a subtree in Theme to apply a theme to every child component in that region.
ThemeNested
Nested Theme providers let a local region use a different theme without affecting the rest of the page.
ThemeShowcase
Two visually distinct theme providers wrapping identical content to show how Theme changes the visual treatment of child components.
ThemeSwitcher
Use state to switch the theme object passed to Theme and preview a different visual treatment.
useThemeHookUsage
Read resolved theme token values with useTheme for non-CSS consumers like SVG charts.
ToolbarCardHeader
A toolbar as a card header with a left-aligned title and icon actions on the right. Use Toolbar instead of LayoutHeader when your card header has interactive actions; Toolbar adds start/end slot layout, keyboard navigation, and automatic size cascading. If the header is just a title with no actions, a LayoutHeader or Section is enough.
ToolbarSizes
Small, medium, and large toolbars side by side. The size prop cascades to child buttons and inputs automatically. Use small in dense UIs like cards, medium for most cases, and large for spacious layouts.
ToolbarThreeSlot
A toolbar with start, center, and end content using the three-column grid layout. Use when you need a centered title or heading with navigation and actions on either side.
ToolbarWithTabs
A toolbar with tabs in the start slot and an action button at the end. Use as a card or section header when content is split into tabs with a primary action alongside.
VisuallyHiddenShowcase
VisuallyHiddenStructuralHeading
Give a visually implicit section an accessible name so screen-reader users can navigate to it.
VisuallyHiddenSupplementaryContext
Add screen-reader-only context to terse visual data, like spelling out what a trend arrow means.

---

# ClickableCard

Interactive card for navigation/action targets. Nested interactive elements work independently.

**Import:** `import {ClickableCard} from '@astryxdesign/core/ClickableCard';`

## Anatomy

| Element   | Required | Description                                              |
| --------- | -------- | -------------------------------------------------------- |
| Container | Yes      | Interactive div with hover/focus/active states.          |
| Content   | Yes      | Children, which may include nested interactive elements. |

## Best Practices

- **Do:** Use for cards navigating to detail page or triggering single action.
- **Do:** Nest buttons/links freely inside; they handle own events.
- **Don't:** Use for toggling selection; use SelectableCard instead.

## Props

| Prop         | Type                                                                                                                                              | Default     | Description                                                                                                                                         |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `label`      | `string`                                                                                                                                          | —           | accessibility label **(required)**                                                                                                                  |
| `onClick`    | `(event: MouseEvent) => void`                                                                                                                     | —           | click handler: fires on card surface only                                                                                                           |
| `href`       | `string`                                                                                                                                          | —           | navigation URL                                                                                                                                      |
| `target`     | `string`                                                                                                                                          | `'_self'`   | link target                                                                                                                                         |
| `isDisabled` | `boolean`                                                                                                                                         | `false`     | disables card                                                                                                                                       |
| `children`   | `ReactNode`                                                                                                                                       | —           | Card content.                                                                                                                                       |
| `padding`    | `0 \| 0.5 \| 1 \| 1.5 \| 2 \| 3 \| 4 \| 5 \| 6 \| 8 \| 10`                                                                                        | `4`         | inner padding                                                                                                                                       |
| `variant`    | `'default' \| 'transparent' \| 'muted' \| 'blue' \| 'cyan' \| 'gray' \| 'green' \| 'orange' \| 'pink' \| 'purple' \| 'red' \| 'teal' \| 'yellow'` | `'default'` | background color variant                                                                                                                            |
| `width`      | `SizeValue`                                                                                                                                       | —           | card width                                                                                                                                          |
| `height`     | `SizeValue`                                                                                                                                       | —           | card height                                                                                                                                         |
| `maxWidth`   | `SizeValue`                                                                                                                                       | —           | max card width                                                                                                                                      |
| `xstyle`     | `StyleXStyles`                                                                                                                                    | —           | StyleX styles for layout customization (margins, positioning, sizing). Must be a stylex.create() value, not an inline style object like style={{}}. |

## Theming

| Component class         | Preferred data attributes | Props                                                                                         | States |
| ----------------------- | ------------------------- | --------------------------------------------------------------------------------------------- | ------ |
| `astryx-clickable-card` | `data-variant`            | default, transparent, muted, blue, cyan, gray, green, orange, pink, purple, red, teal, yellow | —      |

Override in defineTheme:

```ts
components: {
  'clickable-card': {
    base: { /* CSS properties */ },
    'variant:value': { /* variant-specific */ },
  },
}
```

Related block templates:

ClickableCardShowcase
A clickable card that navigates on click. Nested interactive elements work independently.
ClickableCardWithNestedButton
A product card that navigates on click but has an independent "Add to cart" button inside.

---

# Table

Table displays structured data in rows and columns with consistent dimensionality. It supports rich cell content, sorting, selection, pagination, and column management through a composable plugin system. Use Table for data sets with uniform structure; for simpler or inconsistent data, consider a list or card layout instead.

**Import:** `import {Table} from '@astryxdesign/core/Table';`

## Anatomy

| Element        | Required | Description                                            |
| -------------- | -------- | ------------------------------------------------------ |
| Column Header  | Yes      | Displays titles, sorting controls, and bulk selection. |
| Body Rows      | Yes      | Rows with consistent data structure.                   |
| Footer         | No       | Displays summary or totals.                            |
| Top Bar        | No       | Contains title, toolbar, and filters.                  |
| Bottom Bar     | No       | Contains pagination controls.                          |
| Support Panels | No       | Displays row details in a side panel.                  |

## Best Practices

- **Do:** Use density and divider variants to match the information density and scanning needs of your data.
- **Do:** Compose rich cell content with Astryx components like Badge, StatusDot, and Avatar via renderCell.
- **Do:** Set explicit width on every column via proportional() or pixel(). proportional(1) = equal flex w/ 120px min preventing collapse on narrow viewports. Omitting width skips the minimum.
- **Do:** Data-driven API is RSC-safe: proportional(), pixel(), column defs w/o function props work in Server Components. renderCell (any function prop) requires a "use client" wrapper.
- **Don't:** Use a table for data without consistent columns. Use a list or card layout for heterogeneous content.
- **Don't:** Enable every plugin at once. Add only the features your use case requires to keep the interface focused.
- **Don't:** Omit width on text-heavy columns; w/o explicit proportional() width they have no minimum and can squish to near-zero on mobile.

## Props

| Prop            | Type                                                    | Default      | Description                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| --------------- | ------------------------------------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `data`          | `T[]`                                                   | —            | Array of data items to render as rows. T must extend Record<string, unknown> (use `interface MyRow extends Record<string, unknown>` for custom types).                                                                                                                                                                                                                                                                                         |
| `columns`       | `TableColumn<T>[]`                                      | —            | Column definitions: each column has {key, header, width?, align?, renderCell?}. The `header` field sets the column heading text. If omitted, columns are auto-generated from data object keys. The `width` field is typed as `ColumnWidth` (not a number); use `proportional(n)` or `pixel(n)` helpers imported from `@astryxdesign/core/Table`. Example: `width: pixel(120)` for 120px fixed, `width: proportional(1)` for flex distribution. |
| `idKey`         | `(keyof T & string) \| ((item: T) => string \| number)` | —            | Row key for React reconciliation. Pass a property name string or a function. Falls back to row index if omitted.                                                                                                                                                                                                                                                                                                                               |
| `density`       | `'compact' \| 'balanced' \| 'spacious'`                 | `'balanced'` | Row density controlling cell padding and font size.                                                                                                                                                                                                                                                                                                                                                                                            |
| `dividers`      | `'rows' \| 'columns' \| 'grid' \| 'none'`               | `'rows'`     | Divider style rendered between cells.                                                                                                                                                                                                                                                                                                                                                                                                          |
| `isStriped`     | `boolean`                                               | `false`      | Applies a background wash to even-numbered rows.                                                                                                                                                                                                                                                                                                                                                                                               |
| `hasHover`      | `boolean`                                               | `false`      | Applies a hover highlight background to rows on pointer devices.                                                                                                                                                                                                                                                                                                                                                                               |
| `verticalAlign` | `'middle' \| 'top' \| 'bottom'`                         | `'middle'`   | Vertical alignment for body row cells. Controls `vertical-align` on the `<td>` elements.                                                                                                                                                                                                                                                                                                                                                       |
| `textOverflow`  | `'wrap' \| 'truncate'`                                  | `'wrap'`     | How body cell text behaves when it exceeds the column width. 'wrap' lets text wrap and the row grow taller; 'truncate' clips with an ellipsis (default-rendered cells show a tooltip on hover when truncated). Header cells always truncate.                                                                                                                                                                                                   |
| `plugins`       | `Record<string, TablePlugin<T>>`                        | —            | Named plugins that extend table behavior via the transform pipeline. Converted to an ordered array internally.                                                                                                                                                                                                                                                                                                                                 |
| `children`      | `ReactNode`                                             | —            | Children mode: render TableRow/TableCell directly instead of using data-driven rendering.                                                                                                                                                                                                                                                                                                                                                      |
| `xstyle`        | `StyleXStyles`                                          | —            | StyleX styles for layout customization (margins, positioning, sizing). Must be a stylex.create() value: not an inline style object like style={{}}.                                                                                                                                                                                                                                                                                            |

## Components

### TableRow

See `npx astryx component TableRow` for props and usage.

### TableCell

See `npx astryx component TableCell` for props and usage.

### TableHeaderCell

See `npx astryx component TableHeaderCell` for props and usage.

### useTableSelection

See `npx astryx component useTableSelection` for props and usage.

### useTableSelectionState

See `npx astryx component useTableSelectionState` for props and usage.

### useTableSortable

See `npx astryx component useTableSortable` for props and usage.

### useTableTreeData

See `npx astryx component useTableTreeData` for props and usage.

### useTableTreeState

See `npx astryx component useTableTreeState` for props and usage.

### useTablePagination

See `npx astryx component useTablePagination` for props and usage.

### useTableColumnSettings

See `npx astryx component useTableColumnSettings` for props and usage.

### useTableFiltering

See `npx astryx component useTableFiltering` for props and usage.

### useTableFilterState

See `npx astryx component useTableFilterState` for props and usage.

## Theming

| Component class               | Preferred data attributes | Props | States |
| ----------------------------- | ------------------------- | ----- | ------ |
| `astryx-base-table`           | —                         | —     | —      |
| `astryx-table`                | —                         | —     | —      |
| `astryx-table-scroll-wrapper` | —                         | —     | —      |
| `astryx-table-header`         | —                         | —     | —      |
| `astryx-table-body`           | —                         | —     | —      |
| `astryx-table-footer`         | —                         | —     | —      |
| `astryx-table-row`            | —                         | —     | —      |
| `astryx-table-cell`           | —                         | —     | —      |
| `astryx-table-header-cell`    | —                         | —     | —      |

Override in defineTheme:

```ts
components: {
  'base-table': {
    base: { /* CSS properties */ },
  },
  'table': {
    base: { /* CSS properties */ },
  },
}
```

Related block templates:

PaginationPageSize
A transactions table with pagination and a page size dropdown at the bottom. Shows how pagination works as a footer below real content, with adjustable rows per page.
PaginationWithTable
Pagination below a data table with client-side page slicing. Use the count variant with small size for dense data views where users need to see item ranges.
PowerSearchSearchWithTable
Composition of PowerSearch with Table using usePowerSearchConfig to auto-generate config and filter data.
ColumnResizeHookUsage
A Table using useTableColumnResize. Drag the right edge of any column header to resize; widths are committed on release. The last proportional column flexes to fill remaining space.
StickyColumnsHookUsage
A Table using useTableStickyColumns to pin the Name column to the start edge and Status to the end edge. Scroll horizontally; pinned columns stay in view with a soft shadow over the scrolling content.
TableColumnSettingsTable
Table with a column visibility picker in the toolbar. Toggle columns on and off.
TableFilterableTable
Table with popover filter controls triggered by icons in column headers.
TableGridDividersTable
Compact table with grid dividers showing both row and column borders, suited for dense numeric data.
TableGroupedRowsTable
A table grouped into collapsible sections with useTableGroupedRows. Each group gets a full-width header with a chevron, label, and member count; click to collapse/expand.
TableInCard
Table composed inside a card with a heading, demonstrating container bleed alignment.
TableInlineFilterTable
Table with inline filter controls rendered directly below each column header.
TablePaginatedTable
Paginated data table navigating through a larger dataset page by page.
TableResizableTable
Table with draggable column resize handles. Drag the right edge of any header to resize.
TableRichCellTable
Table with rich cell content using Link for emails and Badge for role labels.
TableRowExpansionTable
A tree table using useTableRowExpansion with inherited columns. Child rows use the same columns as parents, indented by depth. Click the chevron or right-click to expand/collapse.
TableRowIndexTable
A table with a prepended row-number column via useTableRowIndex. Numbering is monospaced, right-aligned, and follows the rendered data order.
TableSelectableTable
Table with row selection checkboxes and a select-all header checkbox.
TableShowcase
Data-driven table with proportional and pixel column widths and hover highlighting.
TableSortableTable
Table with sortable columns, click headers to sort ascending or descending.
TableStripedTable
Table with alternating row colors and hover highlighting for easy scanning.
ToolbarBulkActions
A compact toolbar with the muted variant for showing bulk selection actions. Use when the user selects multiple items in a list or table and needs quick access to batch operations.
ToolbarTableFilter
A compact toolbar with a search input, Status and Priority filter selectors, and an overflow menu. Use above a data table to let users search, filter, and access view options.

---

# TableRow

<tr> wrapper; reads TableContext for striped/hover/divider styles.

**Import:** `import {TableRow} from '@astryxdesign/core/Table';`

## Props

| Prop       | Type        | Default | Description                       |
| ---------- | ----------- | ------- | --------------------------------- |
| `children` | `ReactNode` | —       | Row cell elements. **(required)** |

---

# TableCell

<td> wrapper; reads TableContext for density padding, font size, divider borders.

**Import:** `import {TableCell} from '@astryxdesign/core/Table';`

## Props

| Prop       | Type        | Default | Description   |
| ---------- | ----------- | ------- | ------------- |
| `children` | `ReactNode` | —       | Cell content. |

---

# TableHeaderCell

<th> wrapper; reads TableContext for density padding, semibold weight, secondary color, dividers.

**Import:** `import {TableHeaderCell} from '@astryxdesign/core/Table';`

## Props

| Prop       | Type        | Default | Description          |
| ---------- | ----------- | ------- | -------------------- |
| `children` | `ReactNode` | —       | Header cell content. |

---

# TextInput

TextInput collects short-form text like names, emails, or search queries. Use it for single-line values where the expected input is brief. Pair it with validation status to guide users through required or formatted fields.

**Import:** `import {TextInput} from '@astryxdesign/core/TextInput';`

## Anatomy

| Element      | Required | Description                                                                                             |
| ------------ | -------- | ------------------------------------------------------------------------------------------------------- |
| Label        | Yes      | Text that identifies the field. Always rendered for accessibility even when visually hidden.            |
| Description  | No       | Helper text between the label and the input that provides additional context or formatting hints.       |
| Start icon   | No       | A leading icon inside the input that hints at the expected content, like a magnifying glass for search. |
| Placeholder  | No       | Hint text shown when the input is empty. Disappears on focus.                                           |
| Clear button | No       | A trailing × button that resets the value and returns focus to the input.                               |
| Spinner      | No       | Loading indicator that appears during async actions like server-side validation.                        |
| Status icon  | No       | A trailing icon (error, warning, or success) that communicates validation state.                        |

## Best Practices

- **Do:** Always provide a visible label so users know what the field is for. Only hide the label when surrounding context makes it obvious, like a search bar with a magnifying-glass icon.
- **Do:** Use validation status with a message to explain what went wrong: "Email must include @" is better than just turning the border red.
- **Do:** Size the input to match the expected content length so users can gauge how much to type: small for zip codes, medium for names, large for URLs.
- **Do:** Add a clear button for search and filter inputs so users can quickly reset without selecting all text.
- **Don't:** Don't use placeholder text as a replacement for a label; placeholders disappear on focus and are not reliably read by screen readers.
- **Don't:** Don't use TextInput for multi-line content like comments or descriptions; use TextArea instead.
- **Don't:** Don't mark every field as required; only flag mandatory fields so users are not overwhelmed by validation errors.
- **Don't:** Don't wrap a disabled TextInput in Tooltip to explain why it's disabled; disabled controls swallow the hover events the wrapper needs. Use the disabledMessage prop instead.

## Props

| Prop              | Type                                                                         | Default  | Description                                                                                                                                                                                                 |
| ----------------- | ---------------------------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `type`            | `'text' \| 'password' \| 'email'`                                            | `'text'` | HTML input type.                                                                                                                                                                                            |
| `label`           | `string`                                                                     | —        | Label text for input; always rendered for a11y. **(required)**                                                                                                                                              |
| `value`           | `string`                                                                     | —        | Current input value. **(required)**                                                                                                                                                                         |
| `onChange`        | `(value: string, e: ChangeEvent<HTMLInputElement>) => void`                  | —        | Fired on input value change.                                                                                                                                                                                |
| `changeAction`    | `(value: string, e: ChangeEvent<HTMLInputElement>) => void \| Promise<void>` | —        | Async action after onChange (if not prevented). Triggers optimistic update+spinner while pending.                                                                                                           |
| `size`            | `'sm' \| 'md' \| 'lg'`                                                       | `'md'`   | Size variant of input.                                                                                                                                                                                      |
| `isLabelHidden`   | `boolean`                                                                    | `false`  | Visually hides label; keeps screen reader access.                                                                                                                                                           |
| `description`     | `string`                                                                     | —        | Description text between label+input.                                                                                                                                                                       |
| `isOptional`      | `boolean`                                                                    | `false`  | Shows "Optional" indicator. Mutually exclusive w/ isRequired.                                                                                                                                               |
| `isRequired`      | `boolean`                                                                    | `false`  | Shows "Required" indicator+sets aria-required. Mutually exclusive w/ isOptional.                                                                                                                            |
| `isDisabled`      | `boolean`                                                                    | `false`  | Disables input, prevents interaction, dims element.                                                                                                                                                         |
| `disabledMessage` | `string`                                                                     | —        | Explains why input is disabled. With isDisabled, shows tooltip on hover/focus + keeps input focusable via aria-disabled (field becomes read-only). Use instead of wrapping a disabled TextInput in Tooltip. |
| `isLoading`       | `boolean`                                                                    | `false`  | Loading state w/ spinner+aria-busy.                                                                                                                                                                         |
| `placeholder`     | `string`                                                                     | —        | Placeholder when input empty.                                                                                                                                                                               |
| `labelTooltip`    | `string`                                                                     | —        | Tooltip in info icon at label end.                                                                                                                                                                          |
| `startIcon`       | `IconType`                                                                   | —        | SVG icon at input start (e.g. heroicons or lucide).                                                                                                                                                         |
| `status`          | `{type: 'error' \| 'warning' \| 'success', message?: string}`                | —        | Validation status; colored border+icon. Message floats below. Error sets aria-invalid.                                                                                                                      |
| `hasClear`        | `boolean`                                                                    | `false`  | Shows clear button when input has value. Clears value on click.                                                                                                                                             |
| `hasAutoFocus`    | `boolean`                                                                    | `false`  | Auto-focus input on mount.                                                                                                                                                                                  |
| `htmlName`        | `string`                                                                     | —        | HTML name attr for form submissions.                                                                                                                                                                        |

## Theming

| Component class     | Preferred data attributes  | Props        | States |
| ------------------- | -------------------------- | ------------ | ------ |
| `astryx-text-input` | `data-size`, `data-status` | size, status | —      |

Override in defineTheme:

```ts
components: {
  'text-input': {
    base: { /* CSS properties */ },
    'size:value': { /* variant-specific */ },
  },
}
```

Related block templates:

DialogFormDialog
Collects user input without navigating away from the page. Uses purpose="form" so clicking the backdrop won't close it. Use for editing profiles, creating items, or updating settings inline.
FieldRequired
Required and optional field indicators side by side. Use isRequired on fields the user must fill in, and isOptional to clarify which fields can be skipped.
FieldShowcase
A form field wrapping a text input with a label, description, and validation status.
FieldStatusVariants
All three validation states: error, warning, and success. Use error for invalid input, warning for potential issues like reserved names, and success to confirm valid entries like API keys.
FieldWithDescription
Fields with helper text below the label. Use descriptions to explain format requirements, constraints, or what happens with the data, like "At least 8 characters" or "We will send a confirmation link".
FormLayoutHorizontal
Two fields side by side for naturally paired inputs like first and last name
FormLayoutHorizontalLabels
Settings form with labels placed beside their inputs
FormLayoutMixedControls
Form with different control types: text input, selector, and checkboxes
FormLayoutNested
Address form mixing vertical and horizontal layouts for grouped fields
FormLayoutShowcase
A vertical form layout with text input fields.
InputGroupBasic
A currency field with static prefix and suffix addons around a TextInput. Use InputGroupText to clarify units or input format.
InputGroupShowcase
TextInputIcon
Inputs with a leading icon that hints at the expected content. Use when the icon helps users identify the field faster, like a lock for passwords or an envelope for email.
TextInputSearch
Search input with a hidden label, start icon, and clear button. Use for toolbar and header search bars where the icon provides sufficient context.
TextInputShowcase
TextInputSizes
Small, medium, and large inputs side by side. Use small in dense UIs like table filters, medium for most forms, and large for prominent single-field pages.
TextInputStates
Error, warning, and success validation states with status messages. Use to show users what went wrong and how to fix it.
TextInputTypes
Text, password, and email types plus field-level features: tooltip, required, optional, description, disabled, and loading.
ToolbarTableFilter
A compact toolbar with a search input, Status and Priority filter selectors, and an overflow menu. Use above a data table to let users search, filter, and access view options.

---

# TextArea

Multi-line input for comments, descriptions, messages. Use when input spans multiple lines; use TextInput for single-line.

**Import:** `import {TextArea} from '@astryxdesign/core/TextArea';`

## Best Practices

- **Do:** Visible label or isLabelHidden with descriptive label for screen readers.
- **Do:** Set maxLength for character counter when a limit exists.
- **Do:** Use status prop for inline validation: success, warning, error.
- **Do:** Add description or placeholder for context; never placeholder alone as label.
- **Don't:** Avoid TextArea for single-line values; use TextInput.
- **Don't:** Don't use placeholder as only label; disappears on focus, not accessible.
- **Don't:** Don't show status message without status type; border and icon draw attention.
- **Don't:** Don't wrap a disabled TextArea in Tooltip to explain the disabled state; use the disabledMessage prop instead.

## Props

| Prop              | Type                                                                            | Default | Description                                                                                                                                                                                                      |
| ----------------- | ------------------------------------------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ref`             | `React.Ref<HTMLTextAreaElement>`                                                | —       | ref forwarded to underlying <textarea>.                                                                                                                                                                          |
| `label`           | `string`                                                                        | —       | Label text for textarea; always rendered for a11y. **(required)**                                                                                                                                                |
| `value`           | `string`                                                                        | —       | Current textarea value. **(required)**                                                                                                                                                                           |
| `onChange`        | `(value: string, e: ChangeEvent<HTMLTextAreaElement>) => void`                  | —       | Fired on textarea value change.                                                                                                                                                                                  |
| `changeAction`    | `(value: string, e: ChangeEvent<HTMLTextAreaElement>) => void \| Promise<void>` | —       | Async action after onChange in React transition. Enables useOptimistic.                                                                                                                                          |
| `isLabelHidden`   | `boolean`                                                                       | `false` | Visually hides label; keeps screen reader access.                                                                                                                                                                |
| `description`     | `string`                                                                        | —       | Helper text between label+textarea.                                                                                                                                                                              |
| `isOptional`      | `boolean`                                                                       | `false` | Shows "Optional" indicator. Mutually exclusive w/ isRequired.                                                                                                                                                    |
| `isRequired`      | `boolean`                                                                       | `false` | Shows "Required" indicator+sets aria-required. Mutually exclusive w/ isOptional.                                                                                                                                 |
| `isDisabled`      | `boolean`                                                                       | `false` | Disables textarea, prevents interaction.                                                                                                                                                                         |
| `disabledMessage` | `string`                                                                        | —       | Explains why textarea is disabled. With isDisabled, shows tooltip on hover/focus + keeps textarea focusable via aria-disabled (field becomes read-only). Use instead of wrapping a disabled TextArea in Tooltip. |
| `isLoading`       | `boolean`                                                                       | `false` | Loading state w/ spinner inside input.                                                                                                                                                                           |
| `placeholder`     | `string`                                                                        | —       | Placeholder when textarea empty.                                                                                                                                                                                 |
| `rows`            | `number`                                                                        | `3`     | Visible text rows.                                                                                                                                                                                               |
| `maxLength`       | `number`                                                                        | —       | Max chars allowed. Shows counter (current/max) below textarea. No native enforcement.                                                                                                                            |
| `status`          | `{ type: 'warning' \| 'error' \| 'success'; message?: string }`                 | —       | Colored border+icon status. Optional floating message below textarea.                                                                                                                                            |
| `labelTooltip`    | `string`                                                                        | —       | Tooltip in info icon at label end.                                                                                                                                                                               |
| `startIcon`       | `IconType`                                                                      | —       | Icon inside leading edge of textarea wrapper.                                                                                                                                                                    |
| `hasSpellCheck`   | `boolean`                                                                       | `true`  | Enables/disables browser spell checking.                                                                                                                                                                         |
| `hasAutoFocus`    | `boolean`                                                                       | `false` | Auto-focus textarea on mount.                                                                                                                                                                                    |
| `size`            | `'sm' \| 'md' \| 'lg'`                                                          | `'md'`  | Textarea size; affects internal padding. Height controlled by rows.                                                                                                                                              |
| `onPaste`         | `(e: ClipboardEvent<HTMLTextAreaElement>) => void`                              | —       | Fired on paste into textarea.                                                                                                                                                                                    |
| `htmlName`        | `string`                                                                        | —       | HTML name attr for form submissions.                                                                                                                                                                             |
| `onFocus`         | `(e: FocusEvent<HTMLTextAreaElement>) => void`                                  | —       | Callback on focus.                                                                                                                                                                                               |
| `onBlur`          | `(e: FocusEvent<HTMLTextAreaElement>) => void`                                  | —       | Callback on blur.                                                                                                                                                                                                |
| `xstyle`          | `StyleXStyles`                                                                  | —       | StyleX styles for layout customization. Must be stylex.create() value, not inline style.                                                                                                                         |

## Theming

| Component class   | Preferred data attributes  | Props        | States |
| ----------------- | -------------------------- | ------------ | ------ |
| `astryx-textarea` | `data-size`, `data-status` | size, status | —      |

Override in defineTheme:

```ts
components: {
  'textarea': {
    base: { /* CSS properties */ },
    'size:value': { /* variant-specific */ },
  },
}
```

Related block templates:

DialogFormDialog
Collects user input without navigating away from the page. Uses purpose="form" so clicking the backdrop won't close it. Use for editing profiles, creating items, or updating settings inline.
TextAreaCharacterCount
Textareas with maxLength and a live character counter. The counter turns red when the limit is exceeded.
TextAreaShowcase
A text area with placeholder text.
TextAreaStates
Required, disabled, and loading textareas side by side. Shows the interactive states the component supports.
TextAreaValidation
All three status variants (error, warning, and success) with status messages, plus error without a message. Use to show inline validation feedback as the user types.
TextAreaWithIcon
Textareas with a leading icon that hints at the expected content, like a chat bubble for messages or a pencil for notes.

---

# Field

Field wraps custom/native/third-party controls lacking field UI. Use TextInput, Typeahead, Select, DateInput, or TextArea directly when they already expose label/description/status props.

**Import:** `import {Field} from '@astryxdesign/core/Field';`

## Anatomy

| Element                     | Required | Description                                                                                |
| --------------------------- | -------- | ------------------------------------------------------------------------------------------ |
| Label                       | Yes      | Text identifying the field. Always rendered for accessibility, optionally hidden visually. |
| Description                 | No       | Helper text between the label and input explaining what to enter.                          |
| Control slot                | Yes      | A custom, native, or third-party control that does not already render a field shell.       |
| Status message              | No       | Inline validation feedback showing error, warning, or success with a message.              |
| Optional/Required indicator | No       | Badge next to the label showing whether the field is optional or required.                 |
| Label tooltip               | No       | Info icon at the end of the label with a tooltip explaining the field.                     |

## Best Practices

- **Do:** Wrap custom controls/widgets that need labeling, helper text, optional/required indicators, or validation status.
- **Do:** Always provide a label; visually hide it only when context is clear.
- **Do:** Wire inputID/descriptionID to htmlFor and aria-describedby on the inner control.
- **Don't:** Nest Field around styled inputs; it double-renders labels and status UI.
- **Don't:** Use attached status on sliders/switches/checkboxes; use detached so messages do not overlap.
- **Don't:** Set both isOptional and isRequired on the same field.
- **Don't:** Hide the label without another way to understand field purpose.

## Props

| Prop            | Type                                                                              | Default      | Description                                                                                                                                                                                                                                      |
| --------------- | --------------------------------------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `label`         | `string`                                                                          | —            | Label text for the field (always rendered for accessibility). **(required)**                                                                                                                                                                     |
| `inputID`       | `string`                                                                          | —            | ID for the input element (used for the label htmlFor attribute). **(required)**                                                                                                                                                                  |
| `children`      | `ReactNode`                                                                       | —            | The input or control to render. **(required)**                                                                                                                                                                                                   |
| `isLabelHidden` | `boolean`                                                                         | `false`      | Visually hide the label (still accessible to screen readers).                                                                                                                                                                                    |
| `isDisabled`    | `boolean`                                                                         | `false`      | Whether the associated input is disabled. Propagates disabled styling to the label.                                                                                                                                                              |
| `description`   | `string`                                                                          | —            | Description text displayed between the label and input.                                                                                                                                                                                          |
| `descriptionID` | `string`                                                                          | —            | ID for the description element (use for aria-describedby on the input).                                                                                                                                                                          |
| `isOptional`    | `boolean`                                                                         | `false`      | Whether the field is optional (mutually exclusive with isRequired).                                                                                                                                                                              |
| `isRequired`    | `boolean`                                                                         | `false`      | Whether the field is required (mutually exclusive with isOptional).                                                                                                                                                                              |
| `labelIcon`     | `IconType`                                                                        | —            | Icon to display before the label text. See `astryx docs icons` for valid semantic names.                                                                                                                                                         |
| `labelTooltip`  | `string`                                                                          | —            | Tooltip text to display in an info icon at the end of the label.                                                                                                                                                                                 |
| `status`        | `{type: 'warning' \| 'error' \| 'success', message?: string, messageID?: string}` | —            | Status indicator with type and optional message. When message is set, displays a colored status box. messageID is for wiring aria-describedby on the input.                                                                                      |
| `statusVariant` | `'attached' \| 'detached'`                                                        | `'attached'` | How the status message renders relative to the input. Attached overlaps the input border; detached floats below.                                                                                                                                 |
| `width`         | `SizeValue`                                                                       | —            | Width of the field (number = pixels, string used as-is, e.g. "100%"). Sizes the whole field (label, control, and status) so they stay aligned. Prefer this over setting width via xstyle/className/style, which only size the inner control box. |
| `ref`           | `React.Ref<HTMLDivElement>`                                                       | —            | Ref forwarded to the root element.                                                                                                                                                                                                               |
| `xstyle`        | `StyleXStyles`                                                                    | —            | StyleX styles for layout customization (margins, positioning, sizing). Must be a stylex.create() value: not an inline style object like style={{}}.                                                                                              |
| `className`     | `string`                                                                          | —            | CSS class name(s) appended to the root element. Prefer xstyle for StyleX deduplication.                                                                                                                                                          |
| `style`         | `React.CSSProperties`                                                             | —            | Inline styles applied to the root element. Takes priority over StyleX inline styles.                                                                                                                                                             |

## Components

### FieldLabel

See `npx astryx component FieldLabel` for props and usage.

### FieldStatus

See `npx astryx component FieldStatus` for props and usage.

## Examples

### Wrap a custom control

```tsx
function CustomSliderField() {
  return (
    <Field
      label="Confidence"
      inputID="confidence-slider"
      description="Choose how strict the review should be."
      descriptionID="confidence-help"
      status={{ type: 'success', message: 'Recommended default' }}
      statusVariant="detached"
    >
      <input
        id="confidence-slider"
        type="range"
        min={0}
        max={100}
        defaultValue={60}
        aria-describedby="confidence-help"
      />
    </Field>
  );
}
```

## Theming

| Component class       | Preferred data attributes   | Props         | States |
| --------------------- | --------------------------- | ------------- | ------ |
| `astryx-field`        | `data-layout`               | layout        | —      |
| `astryx-field-label`  | —                           | —             | —      |
| `astryx-field-status` | `data-type`, `data-variant` | type, variant | —      |

Override in defineTheme:

```ts
components: {
  'field': {
    base: { /* CSS properties */ },
    'layout:value': { /* variant-specific */ },
  },
  'field-label': {
    base: { /* CSS properties */ },
  },
}
```

Some properties are set via standard CSS in component overrides:

```ts
components: {
  field: {
    base: {
      borderRadius: '...',
    },
  },
}
```

Related block templates:

FieldShowcase
A form field wrapping a text input with a label, description, and validation status.
FieldLabelBasic
Standalone labels with required and optional indicators and a helper description. Use when labeling a custom control that does not render its own label.
FieldLabelShowcase
Standalone field labels demonstrating required, optional, tooltip, and icon variations.

---

# Dialog

Dialog displays a modal overlay that blocks page interaction. Use for delete confirmations, edit forms, terms acceptance.

**Import:** `import {Dialog} from '@astryxdesign/core/Dialog';`

## Anatomy

| Element  | Required | Description                                                                                     |
| -------- | -------- | ----------------------------------------------------------------------------------------------- |
| Header   | Yes      | Title, optional subtitle, and close button. The title receives focus on open for accessibility. |
| Body     | Yes      | The main content area: text, forms, lists, or any layout.                                       |
| Footer   | No       | Action buttons like Save/Cancel or Accept/Decline, aligned to the end.                          |
| Backdrop | Yes      | Semi-transparent overlay behind the dialog that blocks page interaction.                        |

## Best Practices

- **Do:** Choose the right purpose: info for dismissable content, form to prevent accidental backdrop dismissal, required when user must respond.
- **Do:** Include a clear title in the header so users immediately understand what the dialog is asking.
- **Do:** Use purpose="form" for dialogs with inputs so user can't accidentally lose data by clicking the backdrop.
- **Do:** Keep dialogs focused on a single task; if content grows beyond what fits, consider a full page instead.
- **Don't:** Use a dialog for simple messages that could be shown inline or as a toast notification.
- **Don't:** Nest dialogs inside other dialogs; restructure the flow into steps within a single dialog instead.
- **Don't:** Use the fullscreen variant for simple confirmations; it's meant for complex content like editors or long forms.

## Props

| Prop           | Type                             | Default      | Description                                                                                                                                 |
| -------------- | -------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `isOpen`       | `boolean`                        | —            | Whether the dialog is open. **(required)**                                                                                                  |
| `onOpenChange` | `(isOpen: boolean) => unknown`   | —            | Callback when dialog visibility changes. **(required)**                                                                                     |
| `children`     | `ReactNode`                      | —            | Dialog content. **(required)**                                                                                                              |
| `width`        | `number \| string`               | `400`        | Width of the dialog in pixels or any CSS value.                                                                                             |
| `maxHeight`    | `number \| string`               | `'75vh'`     | Maximum height of the dialog.                                                                                                               |
| `position`     | `DialogPosition`                 | —            | Static position for the dialog; centered by default when omitted.                                                                           |
| `variant`      | `'standard' \| 'fullscreen'`     | `'standard'` | Dialog variant: fullscreen expands to fill the entire viewport.                                                                             |
| `purpose`      | `'required' \| 'form' \| 'info'` | `'info'`     | Controls dismissal behavior: required disables Escape and backdrop click; form disables backdrop click after interaction; info allows both. |
| `isInline`     | `boolean`                        | `false`      | Renders dialog content inline without the <dialog> element, backdrop, or modal behavior. For documentation previews and showcases only.     |

## Components

### DialogHeader

See `npx astryx component DialogHeader` for props and usage.

### useImperativeDialog

See `npx astryx component useImperativeDialog` for props and usage.

## Theming

| Component class | Preferred data attributes | Props                | States |
| --------------- | ------------------------- | -------------------- | ------ |
| `astryx-dialog` | `data-variant`            | standard, fullscreen | —      |

Override in defineTheme:

```ts
components: {
  'dialog': {
    base: { /* CSS properties */ },
    'variant:value': { /* variant-specific */ },
  },
}
```

Some properties are set via standard CSS in component overrides:

```ts
components: {
  dialog: {
    base: {
      borderRadius: '...',
      padding: '...',  // expands to container layout tokens
    },
  },
}
```

Related block templates:

DialogConfirmationDialog
Asks the user to confirm a destructive action before it happens. Use before deleting projects, removing team members, revoking API keys, or any irreversible operation.
DialogFormDialog
Collects user input without navigating away from the page. Uses purpose="form" so clicking the backdrop won't close it. Use for editing profiles, creating items, or updating settings inline.
DialogFullscreenDialog
Takes over the entire viewport for content that needs maximum space. Use for documentation viewers, rich text editors, multi-step wizards, or media previews where the standard dialog width is too narrow.
DialogScrollingContent
Constrains the dialog height and scrolls the body when content overflows. Use for terms and conditions, license agreements, changelogs, or any long-form content the user needs to review before accepting.
DialogShowcase
Modal dialog with a header, body content, and close button.
DialogWithSubtitle
Cannot be dismissed by Escape or backdrop click; the user must explicitly choose an action. Uses purpose="required". Use for ownership transfers, legal acknowledgements, or critical decisions where skipping is not an option.
DialogHeaderBasic
A DialogHeader with a title, subtitle, and close button, placed in the header slot of a Dialog Layout. Pass onOpenChange to render the close button.
DialogHeaderShowcase
DialogHeader provides a structured header for dialogs with slots for title, subtitle, close button, and optional start or end content.

---

# AlertDialog

AlertDialog confirms destructive/irreversible action (delete, revoke access, discard changes). To show w/o managing open state, use useImperativeAlertDialog hook: call alert.show(options) + render alert.element in tree.

**Import:** `import {AlertDialog} from '@astryxdesign/core/AlertDialog';`

## Best Practices

- **Do:** Make action button label specific: "Delete project" > "OK"/"Confirm".
- **Do:** Describe consequences in description so user knows outcome before confirming.
- **Don't:** Use AlertDialog for non-destructive actions; use standard Dialog instead.

## Props

| Prop              | Type                           | Default         | Description                                                                                                |
| ----------------- | ------------------------------ | --------------- | ---------------------------------------------------------------------------------------------------------- |
| `isOpen`          | `boolean`                      | —               | Whether the dialog is open. **(required)**                                                                 |
| `onOpenChange`    | `(isOpen: boolean) => unknown` | —               | Visibility change callback. **(required)**                                                                 |
| `title`           | `string`                       | —               | Dialog title. Linked via aria-labelledby. **(required)**                                                   |
| `description`     | `string`                       | —               | Consequence description. Linked via aria-describedby. **(required)**                                       |
| `actionLabel`     | `string`                       | —               | Action button label. **(required)**                                                                        |
| `onAction`        | `() => unknown`                | —               | Called when action button is clicked. Does NOT auto-close. **(required)**                                  |
| `cancelLabel`     | `string`                       | `'Cancel'`      | Cancel button label.                                                                                       |
| `actionVariant`   | `ButtonVariant`                | `'destructive'` | Action button variant.                                                                                     |
| `isActionLoading` | `boolean`                      | —               | Shows loading spinner on the action button.                                                                |
| `width`           | `number \| string`             | `400`           | Dialog width.                                                                                              |
| `isInline`        | `boolean`                      | `false`         | Renders alert dialog content inline without modal behavior. For documentation previews and showcases only. |

## Components

### useImperativeAlertDialog

See `npx astryx component useImperativeAlertDialog` for props and usage.

## Theming

| Component class       | Preferred data attributes | Props | States |
| --------------------- | ------------------------- | ----- | ------ |
| `astryx-alert-dialog` | —                         | —     | —      |

Override in defineTheme:

```ts
components: {
  'alert-dialog': {
    base: { /* CSS properties */ },
  },
}
```

Related block templates:

AlertDialogAsyncAction
A confirmation dialog that shows a spinner while the action runs.
AlertDialogDeleteConfirmation
A delete button that asks the user to confirm before deleting.

---

# Badge

Badge is for status (Active, Failed) and category tags (Engineering, Design). It is NOT for metadata like dates, durations, counts, or descriptions; use description text (Text type="supporting") for those.

**Import:** `import {Badge} from '@astryxdesign/core/Badge';`

## Anatomy

| Element | Required | Description                                                              |
| ------- | -------- | ------------------------------------------------------------------------ |
| Icon    | No       | An optional leading icon that helps identify the badge type at a glance. |
| Label   | Yes      | The text or number shown inside the badge.                               |

## Best Practices

- **Do:** Every badge steals attention. Only badge states where the user needs to act. If no follow-up is needed, use plain text.
- **Do:** Use success/warning/error ONLY for system status requiring attention (Failed, Degraded, Action Required). These are visually loud: solid colored backgrounds.
- **Do:** Use color variants (blue, purple, teal) for category tags that classify items: team names, content types, priority levels.
- **Do:** Keep labels to one or two words. If more detail is needed, put it in surrounding text instead of the badge.
- **Do:** Add an icon when it helps identify the badge type quickly, but always include a text label alongside it.
- **Don't:** Apply "success" badges to every healthy/normal item. If most rows are green "Active", none stand out. Skip the badge for the default state; only highlight exceptions that need attention.
- **Don't:** Use badges for metadata. Durations, counts, dates, descriptions → use Text with type="supporting" instead.
- **Don't:** Use status variants for non-status info. "6h window", "12 types", category names are NOT statuses.
- **Don't:** Repeat loud badges in every row. Common/default states should be plain text; reserve badges for the exceptional.
- **Don't:** Make badges clickable; they are read-only. Use a button or link for actions.

## Props

| Prop      | Type                                                                                                                                                       | Default     | Description           |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | --------------------- |
| `variant` | `'neutral' \| 'info' \| 'success' \| 'warning' \| 'error' \| 'blue' \| 'cyan' \| 'green' \| 'orange' \| 'pink' \| 'purple' \| 'red' \| 'teal' \| 'yellow'` | `'neutral'` | visual style variant  |
| `label`   | `ReactNode`                                                                                                                                                | —           | badge text content    |
| `icon`    | `ReactNode`                                                                                                                                                | —           | optional leading icon |

## Theming

| Component class | Preferred data attributes | Props                                                                                              | States |
| --------------- | ------------------------- | -------------------------------------------------------------------------------------------------- | ------ |
| `astryx-badge`  | `data-variant`            | neutral, info, success, warning, error, blue, cyan, green, orange, pink, purple, red, teal, yellow | —      |

Override in defineTheme:

```ts
components: {
  'badge': {
    base: { /* CSS properties */ },
    'variant:value': { /* variant-specific */ },
  },
}
```

Related block templates:

BadgeCategoryTags
Tag items with color-coded categories like teams, priorities, or topics. Use the 9 non-semantic color variants when you need to distinguish groups visually.
BadgeCountBadges
Show a number inside a badge for notification counts, unread messages, or task totals. Use next to icons, nav items, or list labels.
BadgeShowcase
All semantic and color badge variants in a single view. Use semantic variants for status and color variants for categories.
BadgeStatusLabels
Show the state of an item like Active, Pending, or Failed. Use in table rows, list items, or detail pages where users need to see status at a glance.
ButtonWithEndSlot
Buttons with a trailing badge showing a count or status. Use for notification counts, unread messages, or any button that needs a visual indicator.
CarouselSnap
Scroll-snap carousel with navigation buttons and team member cards. Each card snaps to the start edge on scroll. Use when items should be viewed one at a time rather than as a continuous strip.
ChatComposerDrawerFeedback
Chat composer drawer with a feedback prompt and selectable lettered options. Use for user confirmation workflows that require explicit action before proceeding.
CheckboxListWithEndContent
Badges in the trailing slot show contextual info, like a price or status, next to each option without cluttering the label, so users can compare choices at a glance.
HStackBasic
Items arranged in a horizontal row with a consistent gap and centered vertical alignment. Use HStack whenever siblings should sit side by side.
HStackShowcase
Demonstrates HStack arranging items horizontally with different gaps and alignments.
ItemShowcase
ItemWithMedia
Items with leading avatars and icons in the startContent slot. Keep start content small so the row stays compact and easy to scan.
ItemWithMetadata
Items with end-aligned metadata and badges. Use the endContent slot for counts, status, timestamps, and other secondary row information.
LayoutShowcase
ListMessageList
Chat-style message list with avatars, preview text, and unread badges.
ListItemWithMedia
List items with leading avatars and icons. Use startContent for compact visual identifiers that help users scan the collection.
ListItemWithMetadata
List items with end-aligned metadata. Use endContent for badges, counts, timestamps, and compact status details.
MediaThemeShowcase
A compact media overlay showing MediaTheme adapting text, icons, badges, and button variants over an image-backed dark surface.
MetadataListItemBasic
Labeled key-value rows inside a MetadataList. Values accept any content, from plain text to components like Badge.
OverflowListOverflowBadges
Resizable row of badges that collapses into a count badge on overflow
OverlayBottomStrip
Places compact supporting content in a bottom scrim strip without covering the entire image.
SideNavEndContent
Side navigation items with badges, counts, and context menus as trailing content.
StackDirections
Badges arranged horizontally and vertically in side-by-side cards.
TabListTabsWithBadge
Tabs with notification badge counts rendered via endContent. Uses error variant for urgent counts and neutral for informational ones.
TableRichCellTable
Table with rich cell content using Link for emails and Badge for role labels.
ThemeShowcase
Two visually distinct theme providers wrapping identical content to show how Theme changes the visual treatment of child components.
TokenEndContent
Tokens with trailing content like a count badge or status indicator after the label. Use for notification counts, item quantities, or compact status info.
ToolbarBulkActions
A compact toolbar with the muted variant for showing bulk selection actions. Use when the user selects multiple items in a list or table and needs quick access to batch operations.
TreeListMailboxTree
Email folder tree with unread badge counts.
VStackShowcase
Demonstrates VStack arranging items vertically with different gaps.
VisuallyHiddenStructuralHeading
Give a visually implicit section an accessible name so screen-reader users can navigate to it.

---

# EmptyState

EmptyState shows a placeholder for empty lists, zero search results, first-time setups. Always include a title and next step.

**Import:** `import {EmptyState} from '@astryxdesign/core/EmptyState';`

## Anatomy

| Element     | Required | Description                                                                                   |
| ----------- | -------- | --------------------------------------------------------------------------------------------- |
| Icon        | No       | A visual cue above the title that reinforces the context, like a search icon for no results.  |
| Title       | Yes      | Primary message explaining what is empty: "No projects yet" not "No data".                    |
| Description | No       | Additional context explaining why it is empty or what the user can do.                        |
| Actions     | No       | One or two buttons guiding the user to a next step, like "Create project" or "Clear filters". |

## Best Practices

- **Do:** Include a clear title + call-to-action button so users know how to proceed.
- **Do:** Use an illustration or icon that reinforces the context of the empty state.
- **Do:** Use the compact variant inside cards or sidebars where space is limited.
- **Don't:** Leave an empty state without guidance; always explain what happened and what user can do next.
- **Don't:** Use a generic message like "No data"; be specific about what is empty and why.
- **Don't:** Use an EmptyState for error messages that require immediate action; use a Banner instead.

## Props

| Prop           | Type                         | Default | Description                                                                                     |
| -------------- | ---------------------------- | ------- | ----------------------------------------------------------------------------------------------- |
| `title`        | `string`                     | —       | Primary msg rendered as heading (h1-h6) inside empty state. **(required)**                      |
| `description`  | `string`                     | —       | Optional secondary text w/ additional context below title.                                      |
| `icon`         | `ReactNode`                  | —       | Optional icon/illustration above title; rendered decorative (aria-hidden="true").               |
| `actions`      | `ReactNode`                  | —       | Optional action buttons below description; horizontal by default, vertical when isCompact.      |
| `headingLevel` | `1 \| 2 \| 3 \| 4 \| 5 \| 6` | `3`     | Controls only HTML heading tag (h1-h6) for document outline; does not change visual title size. |
| `isCompact`    | `boolean`                    | `false` | Enables compact variant w/ reduced spacing for constrained areas.                               |
| `xstyle`       | `StyleXStyles`               | —       | StyleX styles for layout customization. Must be stylex.create() value.                          |

## Theming

| Component class      | Preferred data attributes | Props   | States |
| -------------------- | ------------------------- | ------- | ------ |
| `astryx-empty-state` | `data-variant`            | variant | —      |

Override in defineTheme:

```ts
components: {
  'empty-state': {
    base: { /* CSS properties */ },
    'variant:value': { /* variant-specific */ },
  },
}
```

Related block templates:

EmptyStateActions
Full empty state with icon, message, and action buttons. Use when a search returns no results, a filter clears all items, or a list has been emptied. The buttons give the user a way forward: go back, clear filters, or try a different query.
EmptyStateCompact
Smaller empty state with reduced spacing for constrained areas. Use inside sidebar panels, card widgets, or notification drawers where a full-size empty state would overwhelm the layout.
EmptyStateContainer
Empty state wrapped in a Card for first-time setup or onboarding. Use when the user has not created any items yet, like a project list, team roster, or dashboard widget that will fill with data once they take action.
EmptyStateShowcase
A no-results empty state with an icon, descriptive message, and a call-to-action button.

---

# Stack

Stack arranges items in a row or column with consistent spacing. Use the gap prop to control the space between items.

**Import:** `import {Stack} from '@astryxdesign/core/Stack';`

## Best Practices

- **Do:** Use the gap prop for spacing between items; don't add margins manually.
- **Do:** Use StackItem with size="fill" to make one item stretch and fill the leftover space.
- **Don't:** Nest stacks inside stacks; try wrap="wrap" first to let items flow to the next line.

## Components

### HStack

Horizontal stack; left-to-right, polymorphic rendering.

| Prop            | Type                                                                | Default     | Description                                                                                                                                                                                                     |
| --------------- | ------------------------------------------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gap`           | `0 \| 0.5 \| 1 \| 1.5 \| 2 \| 3 \| 4 \| 5 \| 6 \| 8 \| 10`          | —           | Number literal spacing step: 0, 0.5, 1, 1.5, 2, 3, 4, 5, 6, 8, 10. Use gap={4} not gap="4".                                                                                                                     |
| `padding`       | `0 \| 0.5 \| 1 \| 1.5 \| 2 \| 3 \| 4 \| 5 \| 6 \| 8 \| 10`          | —           | Inner padding on all sides, using the spacing scale (0, 0.5, 1, 1.5, 2, 3, 4, 5, 6, 8, 10). Matches the padding prop on Card, LayoutContent, and LayoutPanel. Pass as a JSX number expression e.g. padding={3}. |
| `paddingInline` | `0 \| 0.5 \| 1 \| 1.5 \| 2 \| 3 \| 4 \| 5 \| 6 \| 8 \| 10`          | —           | Inline (horizontal) padding, using the spacing scale. Overrides padding on the inline axis when both are set.                                                                                                   |
| `paddingBlock`  | `0 \| 0.5 \| 1 \| 1.5 \| 2 \| 3 \| 4 \| 5 \| 6 \| 8 \| 10`          | —           | Block (vertical) padding, using the spacing scale. Overrides padding on the block axis when both are set.                                                                                                       |
| `isScrollable`  | `boolean`                                                           | `false`     | Enables scrollable overflow (overflow: auto). Matches isScrollable on LayoutContent and LayoutPanel.                                                                                                            |
| `width`         | `SizeValue`                                                         | —           | Width of container. Numbers=pixels, strings=as-is (e.g. '100%').                                                                                                                                                |
| `height`        | `SizeValue`                                                         | —           | Height of container. Numbers=pixels, strings=as-is (e.g. '100%').                                                                                                                                               |
| `maxWidth`      | `SizeValue`                                                         | —           | Maximum width of the stack container. Numbers are treated as pixels, strings are used as-is (e.g., '100%').                                                                                                     |
| `minHeight`     | `SizeValue`                                                         | —           | Minimum height of the stack container. Numbers are treated as pixels, strings are used as-is (e.g., '100%').                                                                                                    |
| `hAlign`        | `'start' \| 'center' \| 'end' \| 'between' \| 'around' \| 'evenly'` | —           | Horizontal (main-axis) alignment.                                                                                                                                                                               |
| `vAlign`        | `'start' \| 'center' \| 'end' \| 'stretch'`                         | `'stretch'` | Vertical (cross-axis) alignment.                                                                                                                                                                                |
| `justify`       | `'start' \| 'center' \| 'end' \| 'between' \| 'around' \| 'evenly'` | —           | Main-axis alignment alias for hAlign. Mirrors CSS justify-content.                                                                                                                                              |
| `align`         | `'start' \| 'center' \| 'end' \| 'stretch'`                         | —           | Cross-axis alignment alias for vAlign. Mirrors CSS align-items.                                                                                                                                                 |
| `wrap`          | `'nowrap' \| 'wrap' \| 'wrap-reverse'`                              | `'nowrap'`  | Flex wrap behavior.                                                                                                                                                                                             |
| `as`            | `ElementType`                                                       | `'div'`     | HTML element to render as container.                                                                                                                                                                            |
| `children`      | `ReactNode`                                                         | —           | Stack content.                                                                                                                                                                                                  |
| `xstyle`        | `StyleXStyles`                                                      | —           | StyleX layout styles; must be stylex.create() value.                                                                                                                                                            |

### VStack

Vertical stack; top-to-bottom, polymorphic rendering.

| Prop            | Type                                                                | Default     | Description                                                                                                                                                                                                     |
| --------------- | ------------------------------------------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gap`           | `0 \| 0.5 \| 1 \| 1.5 \| 2 \| 3 \| 4 \| 5 \| 6 \| 8 \| 10`          | —           | Number literal spacing step: 0, 0.5, 1, 1.5, 2, 3, 4, 5, 6, 8, 10. Use gap={4} not gap="4".                                                                                                                     |
| `padding`       | `0 \| 0.5 \| 1 \| 1.5 \| 2 \| 3 \| 4 \| 5 \| 6 \| 8 \| 10`          | —           | Inner padding on all sides, using the spacing scale (0, 0.5, 1, 1.5, 2, 3, 4, 5, 6, 8, 10). Matches the padding prop on Card, LayoutContent, and LayoutPanel. Pass as a JSX number expression e.g. padding={3}. |
| `paddingInline` | `0 \| 0.5 \| 1 \| 1.5 \| 2 \| 3 \| 4 \| 5 \| 6 \| 8 \| 10`          | —           | Inline (horizontal) padding, using the spacing scale. Overrides padding on the inline axis when both are set.                                                                                                   |
| `paddingBlock`  | `0 \| 0.5 \| 1 \| 1.5 \| 2 \| 3 \| 4 \| 5 \| 6 \| 8 \| 10`          | —           | Block (vertical) padding, using the spacing scale. Overrides padding on the block axis when both are set.                                                                                                       |
| `isScrollable`  | `boolean`                                                           | `false`     | Enables scrollable overflow (overflow: auto). Matches isScrollable on LayoutContent and LayoutPanel.                                                                                                            |
| `width`         | `SizeValue`                                                         | —           | Width of container. Numbers=pixels, strings=as-is (e.g. '100%').                                                                                                                                                |
| `height`        | `SizeValue`                                                         | —           | Height of container. Numbers=pixels, strings=as-is (e.g. '100%').                                                                                                                                               |
| `maxWidth`      | `SizeValue`                                                         | —           | Maximum width of the stack container. Numbers are treated as pixels, strings are used as-is (e.g., '100%').                                                                                                     |
| `minHeight`     | `SizeValue`                                                         | —           | Minimum height of the stack container. Numbers are treated as pixels, strings are used as-is (e.g., '100%').                                                                                                    |
| `hAlign`        | `'start' \| 'center' \| 'end' \| 'stretch'`                         | `'stretch'` | Horizontal (cross-axis) alignment.                                                                                                                                                                              |
| `vAlign`        | `'start' \| 'center' \| 'end' \| 'between' \| 'around' \| 'evenly'` | —           | Vertical (main-axis) alignment.                                                                                                                                                                                 |
| `justify`       | `'start' \| 'center' \| 'end' \| 'between' \| 'around' \| 'evenly'` | —           | Main-axis alignment alias for vAlign. Mirrors CSS justify-content.                                                                                                                                              |
| `align`         | `'start' \| 'center' \| 'end' \| 'stretch'`                         | —           | Cross-axis alignment alias for hAlign. Mirrors CSS align-items.                                                                                                                                                 |
| `wrap`          | `'nowrap' \| 'wrap' \| 'wrap-reverse'`                              | `'nowrap'`  | Flex wrap behavior.                                                                                                                                                                                             |
| `as`            | `ElementType`                                                       | `'div'`     | HTML element to render as container.                                                                                                                                                                            |
| `children`      | `ReactNode`                                                         | —           | Stack content.                                                                                                                                                                                                  |

### StackItem

Controls individual item behavior in stack; polymorphic rendering.

| Prop             | Type                                        | Default    | Description                                                                                                                                                                                                                              |
| ---------------- | ------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `size`           | `'static' \| 'fill'`                        | `'static'` | Flex grow: static=natural size, fill=expand to remaining space.                                                                                                                                                                          |
| `isScrollable`   | `boolean`                                   | `false`    | Enables scrollable overflow (overflow: auto). StackItem already applies the flex min-height/min-width reset, so <StackItem size="fill" isScrollable> is a complete scroll region. Matches isScrollable on LayoutContent and LayoutPanel. |
| `crossAlignSelf` | `'start' \| 'center' \| 'end' \| 'stretch'` | —          | Override cross-axis alignment for this item, ignoring parent.                                                                                                                                                                            |
| `as`             | `ElementType`                               | `'div'`    | HTML element to render as wrapper.                                                                                                                                                                                                       |
| `children`       | `ReactNode`                                 | —          | Item content.                                                                                                                                                                                                                            |

## Theming

| Component class     | Preferred data attributes                 | Props                | States |
| ------------------- | ----------------------------------------- | -------------------- | ------ |
| `astryx-stack`      | `data-direction`, `data-gap`, `data-wrap` | direction, gap, wrap | —      |
| `astryx-stack-item` | `data-size`                               | size                 | —      |

Override in defineTheme:

```ts
components: {
  'stack': {
    base: { /* CSS properties */ },
    'direction:value': { /* variant-specific */ },
  },
  'stack-item': {
    base: { /* CSS properties */ },
  },
}
```

Related block templates:

ChatLayoutShowcase
CodeAcrossTextSizes
Inline code rendered inside heading, body, supporting, and label text. Code automatically matches the font size of its parent text element.
CodeVariousContent
Inline code used for variables, terminal commands, CSS properties, file paths, and keyboard shortcuts. Shows how Code adapts to different kinds of technical content.
CodeBlockBashCommand
Short terminal commands with a copy button and no line numbers. Use for install instructions or one-liner commands that readers will paste directly.
StackItemShowcase
StackItem can be used within HStack or VStack for more granular control over individual item sizing and alignment, but is optional; stack children work without it.
TextColors
All text color options (primary, secondary, disabled, placeholder, active) applied to body text to show their intended use.
TextHeadingLevels
All 6 heading levels (h1 through h6) rendered with Heading to show the full type scale.
TextShowcase
TextTypes
All 5 semantic text types (body, large, label, supporting, code) with their default styling from the theme.
TextWeight
The 4 font weight variants (normal, medium, semibold, bold) applied to body text.
TimestampColors
Timestamp rendered in each available color variant: primary, secondary, disabled, and active.

---

# Grid

A CSS grid layout container for arranging children in rows and columns. Use Grid for card galleries, dashboards, and any multi-column layout. Supports fixed column counts and responsive columns that reflow based on available width.

**Import:** `import {Grid} from '@astryxdesign/core/Grid';`

## Best Practices

- **Do:** Use responsive columns for layouts that should adapt to screen size: columns={{minWidth: 280}}.
- **Do:** Cap the column count with max to prevent rows from getting too wide on large screens.
- **Do:** Use repeat: 'fill' (the default) for consistent item widths. Use 'fit' when items should stretch to fill leftover space.
- **Don't:** Write manual CSS grid; Grid handles spacing and responsive behavior for you.
- **Don't:** Use HStack with wrapping for grids; use Grid instead.
- **Do:** track templates use CSS-var indirection, not inline styles, so xstyle/@media overrides of gridTemplateColumns work.

## Props

| Prop            | Type                                                                   | Default     | Description                                                                                                                                                                                                                                                                                                                                                                     |
| --------------- | ---------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `columns`       | `number \| {minWidth: number, max?: number, repeat?: 'fill' \| 'fit'}` | —           | Column configuration. Use a number for fixed columns (e.g. `columns={3}`). Use an object for responsive columns: `minWidth` sets the minimum column width in px, `repeat` controls track behavior (`"fill"` preserves empty tracks for consistent widths, `"fit"` collapses empty tracks so items stretch; defaults to `"fill"`), and `max` caps the maximum number of columns. |
| `minChildWidth` | `number`                                                               | —           | Deprecated: use `columns={{minWidth: 280}}` instead. Minimum item width in px; enables responsive auto-fit.                                                                                                                                                                                                                                                                     |
| `width`         | `SizeValue`                                                            | —           | Container width. Numbers are treated as pixels, strings are used as-is.                                                                                                                                                                                                                                                                                                         |
| `height`        | `SizeValue`                                                            | —           | Container height. Numbers are treated as pixels, strings are used as-is.                                                                                                                                                                                                                                                                                                        |
| `maxWidth`      | `SizeValue`                                                            | —           | Maximum container width. Numbers are treated as pixels, strings are used as-is.                                                                                                                                                                                                                                                                                                 |
| `minHeight`     | `SizeValue`                                                            | —           | Minimum container height. Numbers are treated as pixels, strings are used as-is.                                                                                                                                                                                                                                                                                                |
| `gap`           | `0 \| 0.5 \| 1 \| 1.5 \| 2 \| 3 \| 4 \| 5 \| 6 \| 8 \| 10`             | —           | Spacing between all items.                                                                                                                                                                                                                                                                                                                                                      |
| `rowGap`        | `0 \| 0.5 \| 1 \| 1.5 \| 2 \| 3 \| 4 \| 5 \| 6 \| 8 \| 10`             | —           | Row spacing; overrides `gap` for the row axis.                                                                                                                                                                                                                                                                                                                                  |
| `columnGap`     | `0 \| 0.5 \| 1 \| 1.5 \| 2 \| 3 \| 4 \| 5 \| 6 \| 8 \| 10`             | —           | Column spacing; overrides `gap` for the column axis.                                                                                                                                                                                                                                                                                                                            |
| `align`         | `'start' \| 'center' \| 'end' \| 'stretch'`                            | `'stretch'` | Vertical alignment of items.                                                                                                                                                                                                                                                                                                                                                    |
| `justify`       | `'start' \| 'center' \| 'end' \| 'stretch'`                            | `'stretch'` | Horizontal alignment of items.                                                                                                                                                                                                                                                                                                                                                  |
| `children`      | `ReactNode`                                                            | —           | Grid content.                                                                                                                                                                                                                                                                                                                                                                   |
| `xstyle`        | `StyleXStyles`                                                         | —           | StyleX styles for layout customization (margins, positioning, sizing). Must be a stylex.create() value: not an inline style object like style={{}}.                                                                                                                                                                                                                             |

## Components

### GridSpan

See `npx astryx component GridSpan` for props and usage.

## Theming

| Component class    | Preferred data attributes                                | Props                        | States |
| ------------------ | -------------------------------------------------------- | ---------------------------- | ------ |
| `astryx-grid`      | `data-align`, `data-columns`, `data-gap`, `data-justify` | align, columns, gap, justify | —      |
| `astryx-grid-span` | —                                                        | —                            | —      |

Override in defineTheme:

```ts
components: {
  'grid': {
    base: { /* CSS properties */ },
    'align:value': { /* variant-specific */ },
  },
  'grid-span': {
    base: { /* CSS properties */ },
  },
}
```

Related block templates:

AspectRatioImageGallery
Grid of images with consistent 4:3 aspect ratios.
BlockquoteTestimonials
Multiple quotes arranged in a card grid for a testimonials section. Combine with Card and Grid to create social-proof layouts.
GridDashboardLayout
Dashboard layout with mixed-size widgets and a full-width summary row
GridGalleryExample
Card gallery with responsive columns that maintain consistent widths
GridResponsiveAutoFit
Responsive grid where cards stretch to fill remaining space
GridShowcase
GridWithGridSpan
Grid with featured items spanning multiple columns and rows
GridSpanColumns
Grid items spanning two of three columns. Wrap a grid child in GridSpan to make it occupy multiple columns for asymmetric layouts.
GridSpanShowcase
GridSpan lets a grid item span multiple columns or rows within an Grid, enabling masonry-style and asymmetric layouts.
LightboxGallery
A thumbnail grid that opens a fullscreen gallery. Clicking any thumbnail opens the lightbox at that index. Prev/next navigation lets users browse all images without closing.
ThemeShowcase
Two visually distinct theme providers wrapping identical content to show how Theme changes the visual treatment of child components.
TopNavMegaMenuItemBasic
Rich link items with an icon, title, and description. Use inside the items slot of a TopNavMegaMenu to describe each destination.

---

# Text

Text renders styled body text and headings. Text for body copy with semantic types, Heading for h1–h6 with theme tokens.

**Import:** `import {Text} from '@astryxdesign/core/Text';`

## Best Practices

- **Do:** Semantic type (body, label, supporting, large, code) instead of manual size/weight.
- **Do:** accessibilityLevel on Heading when visual level differs from document outline.
- **Do:** maxLines for truncation; tooltip shows full text on hover.
- **Do:** hasTabularNumbers for aligned numeric columns.
- **Don't:** Override size/weight when a semantic type already matches.
- **Don't:** Skip heading levels; sequential h1 → h2 → h3.
- **Don't:** Raw <p>/<h1>/<span>; use Text/Heading for theme tokens.
- **Don't:** `variant` prop, which does not exist. Use `type` for text styling or Heading for headings.
- **Don't:** Text for headings: use Heading with level (1–6).

## Props

| Prop                 | Type                                                                                                               | Default    | Description                                                                                                                                                                                                             |
| -------------------- | ------------------------------------------------------------------------------------------------------------------ | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `type`               | `'body' \| 'large' \| 'label' \| 'supporting' \| 'code' \| 'display-1' \| 'display-2' \| 'display-3' \| 'inherit'` | `'body'`   | Semantic text type. Determines size, weight, and line-height from the theme. 'inherit' takes all three from the surrounding text instead. Themes may add custom types. Note: this prop is called `type`, not `variant`. |
| `children`           | `ReactNode`                                                                                                        | —          | Text content. **(required)**                                                                                                                                                                                            |
| `size`               | `'4xs' \| '3xs' \| '2xs' \| 'xsm' \| 'sm' \| 'base' \| 'lg' \| 'xl' \| '2xl' \| '3xl' \| '4xl'`                    | —          | Explicit font size override. Overrides the size from `type` but preserves other type properties. Prefer using `type` alone.                                                                                             |
| `color`              | `'primary' \| 'secondary' \| 'disabled' \| 'placeholder' \| 'accent' \| 'inherit'`                                 | —          | Text color. Defaults to 'secondary' for the 'supporting' type, 'primary' for all others.                                                                                                                                |
| `weight`             | `'normal' \| 'medium' \| 'semibold' \| 'bold'`                                                                     | —          | Font weight override.                                                                                                                                                                                                   |
| `display`            | `'inline' \| 'block'`                                                                                              | `'inline'` | Display type. Silently overridden to 'block' when maxLines > 0 or hasCapsize is true.                                                                                                                                   |
| `as`                 | `'span' \| 'p' \| 'div' \| 'label'`                                                                                | `'span'`   | HTML element to render.                                                                                                                                                                                                 |
| `maxLines`           | `number`                                                                                                           | `0`        | Maximum lines before truncation. 0 means no truncation. When set, shows a tooltip on hover if content is truncated.                                                                                                     |
| `hasTruncateTooltip` | `boolean \| 'above' \| 'below' \| 'start' \| 'end'`                                                                | `true`     | Controls tooltip behavior for truncated text. true shows the tooltip at the default position, false disables it, or a placement string ('above' \| 'below' \| 'start' \| 'end') sets a specific position.               |
| `wordBreak`          | `'break-word' \| 'break-all'`                                                                                      | —          | Word break behavior when truncating. Defaults to 'break-all' for single-line truncation, 'break-word' otherwise.                                                                                                        |
| `textWrap`           | `'wrap' \| 'nowrap' \| 'balance' \| 'pretty'`                                                                      | —          | Text wrapping behavior.                                                                                                                                                                                                 |
| `justify`            | `'start' \| 'center' \| 'end'`                                                                                     | `'start'`  | Text alignment (justification). Uses logical values (start/end) for i18n/RTL compatibility.                                                                                                                             |
| `hasCapsize`         | `boolean`                                                                                                          | `false`    | Enable optical alignment using text-box-trim. Forces block display.                                                                                                                                                     |
| `hasStrikethrough`   | `boolean`                                                                                                          | `false`    | Apply strikethrough text decoration.                                                                                                                                                                                    |
| `hasTabularNumbers`  | `boolean`                                                                                                          | `false`    | Use tabular (monospace) numbers for aligned numeric data.                                                                                                                                                               |
| `id`                 | `string`                                                                                                           | —          | HTML id attribute.                                                                                                                                                                                                      |
| `xstyle`             | `StyleXStyles`                                                                                                     | —          | StyleX styles for layout customization (margins, positioning, sizing). Must be a stylex.create() value: not an inline style object like style={{}}.                                                                     |

## Components

### Heading

See `npx astryx component Heading` for props and usage.

## Theming

| Component class  | Preferred data attributes              | Props             | States |
| ---------------- | -------------------------------------- | ----------------- | ------ |
| `astryx-heading` | `data-level`, `data-color`             | level, color      | —      |
| `astryx-text`    | `data-type`, `data-size`, `data-color` | type, size, color | —      |

Override in defineTheme:

```ts
components: {
  'heading': {
    base: { /* CSS properties */ },
    'level:value': { /* variant-specific */ },
  },
  'text': {
    base: { /* CSS properties */ },
  },
}
```

Related block templates:

AppShellContentOnly
Minimal shell with no navigation, useful for full-bleed pages, auth screens, or embedded views.
AppShellMobileHookUsage
Custom mobile navigation trigger built with useAppShellMobile. The trigger consumes the surrounding AppShell context instead of rendering its own shell.
AppShellShowcase
A basic app shell with content padding.
AppShellSideNavOnly
App shell with SideNav header providing app identity, no TopNav needed.
AppShellTopNavOnly
Simple layout with TopNav and no side navigation, suitable for landing pages.
AppShellTopNavWithSideNav
The most common layout with TopNav for app identity and SideNav for page-level navigation.
AppShellWithBanner
Full layout with TopNav, SideNav, and a dismissable info banner between the nav and content.
AspectRatioShowcase
Three aspect ratio containers at equal height (1:1, 4:3, and 16:9), each showing an image with its ratio labeled below.
AvatarGroup
Overlap multiple avatars in a row to represent a group of people. Use for team lists, PR reviewers, or participant counts where you want to show faces without taking up much space.
AvatarInitialsFallback
Show initials instead of a photo. The avatar extracts the first and last initials from the name automatically. Use when you only have a user name, like in anonymous accounts or new user onboarding.
AvatarUserCard
Place an avatar next to a name and role to create a user card row. Use for comment headers, contact lists, profile sections, or anywhere you need to identify a person at a glance.
AvatarGroupShowcase
Overlapping avatar rows with max limit and server-side overflow count. Shows team members in a compact facepile layout.
AvatarGroupOverflowCustomText
Provide short custom children such as 12+ when the overflow count needs compact product-specific formatting.
AvatarGroupOverflowDefault
Use AvatarGroupOverflow without children to render the standard +N overflow count.
AvatarGroupOverflowShowcase
Overflow indicators for hidden avatars, including the default +N label and custom count text.
BadgeCategoryTags
Tag items with color-coded categories like teams, priorities, or topics. Use the 9 non-semantic color variants when you need to distinguish groups visually.
BadgeCountBadges
Show a number inside a badge for notification counts, unread messages, or task totals. Use next to icons, nav items, or list labels.
BadgeStatusLabels
Show the state of an item like Active, Pending, or Failed. Use in table rows, list items, or detail pages where users need to see status at a glance.
BannerCollapsibleContent
Combine an action button, dismiss control, and expandable detail area in one banner. Use for complex notifications like config changes or deployment summaries.
BaseTypeaheadCustomSearch
BaseTypeahead embedded inside a custom-styled wrapper. The wrapper provides its own border and icon chrome; anchorRef positions the dropdown relative to it. Use this pattern when Typeahead's built-in field layout does not fit your composition.
BreadcrumbsCustomSeparator
Swap the default "/" for a different character like chevrons, arrows, or dots. Use when the visual style of the page calls for a different separator.
BreadcrumbsSupportingVariant
Compare the default and supporting variants side by side. Use the supporting variant in dense UIs like admin panels where the breadcrumb should be subtle.
ButtonSizeVariants
Small, medium, and large buttons side by side. Use small in dense UIs like toolbars, medium for most cases, and large for prominent CTAs.
ButtonVariants
All 4 button variants in default, disabled, and loading states. Use primary for the main action, secondary for most others, ghost for low-emphasis, and destructive for dangerous actions.
ButtonWithEndSlot
Buttons with a trailing badge showing a count or status. Use for notification counts, unread messages, or any button that needs a visual indicator.
CalendarConstraints
Limit which dates can be selected using min/max bounds and custom rules like weekdays only. Use for scheduling UIs where certain dates are unavailable.
CalendarRangeWithValue
Pick a start and end date with the range highlighted between them. Use for booking dates, time-off requests, or report filters.
CalendarSingle
Pick one date from a month grid. Use for appointment dates, due dates, or any field that needs a single date.
CalendarTwoMonths
Two months side by side for selecting ranges that span a month boundary. Use in booking or travel UIs where check-in and check-out often fall in different months.
CardCallout
Muted-variant cards for tips, notes, or supplementary information. Use when content should be visually distinct but not prominent. The muted variant uses a wash background instead of the elevated default, making it feel recessed rather than raised. Works well in sidebars, help panels, or inline callouts.
CardShowcase
A card with a heading and body text showing the default container style.
CardVariants
Default, muted, and color variants side by side. Use color variants to categorize cards visually, like team colors, project tags, or content types. Each color uses the corresponding background token from the theme, so they adapt to light and dark mode automatically.
CardWithInnerLayout
A card with a structured header, content area, and footer with action buttons. Use for forms, dialogs, or settings panels that need clear sections. Pair Card with Layout to get automatic dividers between header, content, and footer. The footer aligns actions to the right by default.
CardWithSimpleContent
A card with a heading and body text. Use for summaries, descriptions, or any grouped content that needs visual separation from the page. The card handles its own border, background, and padding; just pass your content as children. Set a width to constrain it, or leave it to fill the parent.
ClickableCardShowcase
A clickable card that navigates on click. Nested interactive elements work independently.
ClickableCardWithNestedButton
A product card that navigates on click but has an independent "Add to cart" button inside.
SelectableCardMulti
Multi-select tag picker using color variant selectable cards with color-matched selection borders.
SelectableCardShowcase
A plan picker with single-select radio behavior. Cards show an accent border when selected.
CarouselCards
A horizontally scrollable row of cards with snap scrolling enabled. Use for feature grids, product lists, or any set of cards that overflows the available width. The carousel adds fade edges and navigation buttons automatically.
CarouselShowcase
A horizontal carousel of cards with scroll-snap and navigation buttons. Scroll or click the arrows to browse.
CarouselSnap
Scroll-snap carousel with navigation buttons and team member cards. Each card snaps to the start edge on scroll. Use when items should be viewed one at a time rather than as a continuous strip.
CenterHorizontal
An editor toolbar with a document title on the left and formatting actions on the right. This shows axis="horizontal", centering in one direction only. Use when content needs to be horizontally centered while other elements are positioned independently around it.
CenterInsideACard
An empty state with an icon, heading, and description centered both vertically and horizontally inside a card. This is the most common use of Center: placing content in the middle of a fixed-height area like a panel, card, or content region. The height prop defines the centering space.
CenterShowcase
Content centered horizontally and vertically inside a fixed-height container.
ChatComposerFooterActions
Chat composer with dropdown menus for a model selector and settings in the footer, and a mic button in the send actions slot.
ChatComposerFullFeatured
Chat composer with all slots populated: collapsible attachment drawer, header actions, context progress bar, footer dropdown menus, and mic button. Shows the maximum composer configuration.
ChatComposerStreaming
Chat composer with streaming state and a stop button. Use when the assistant is generating a response and the user can cancel.
ChatComposerValidation
Chat composer with error and warning status messages. Status can appear above or below the composer to surface validation or system feedback.
ChatComposerDrawerFeedback
Chat composer drawer with a feedback prompt and selectable lettered options. Use for user confirmation workflows that require explicit action before proceeding.
ChatComposerInputControlledInput
Controlled chat input with live value display. Use controlled mode when you need to read or transform the input value outside the composer.
ChatComposerInputMentionTrigger
Chat input with an @ trigger that opens a typeahead menu for mentioning users. Selected names appear as inline tokens.
ChatComposerInputMultipleTriggers
Chat input with both @ mentions and / commands. Each trigger type renders tokens in a distinct color so users can tell them apart at a glance.
ChatDictationDictationInComposer
Dictation button placed in the sendActions slot of a chat composer. Shows the recommended integration point for voice input alongside the send button.
ChatDictationDictationStates
Dictation button in idle, listening, and speaking states side by side. Shows the three visual phases of a voice input interaction.
ChatDictationSizes
Small and medium dictation buttons side by side. Use small in compact composer densities and medium for standard layouts.
ChatLayoutScrollButtonLabels
Scroll button with different labels for context-specific notifications like new messages, unread replies, or a generic scroll prompt.
ChatLayoutScrollButtonStates
Scroll button in hidden, visible, and expanded (with label) states. The button fades in when the user scrolls up and expands when new messages arrive.
ChatMessageAvatarName
Messages with avatars and sender names. Place the name on the bubble when using bubbles, or on the message wrapper for raw content.
ChatMessageGhost
Ghost variant for messages without visible bubble boundaries. Keeps padding for alignment but renders a transparent background, useful for AI-style responses.
ChatMessageMultiBubble
Grouped bubbles using the group prop for corner radius reduction. Use first, middle, and last to visually connect related bubbles from the same sender.
ChatMessageShowcase
A user multi-bubble group with delivery status and an assistant ghost response with avatar, name, timestamp, and model info.
ChatMessageBubbleDensity
Compact, balanced, and spacious density modes side by side. Density controls bubble padding, corner radius, and spacing between grouped bubbles.
ChatMessageBubbleGrouping
Multi-bubble messages using first, middle, and last group positions. Grouped bubbles tighten corner radius on the sender side for a continuous visual flow.
ChatMessageBubbleMetadata
Bubbles with name and metadata slots aligned to bubble padding. Put name on the first bubble and metadata on the last bubble in a message.
ChatMessageBubbleVariants
Filled and ghost bubble variants for both user and assistant senders. Use filled for standard messages and ghost when content needs alignment without a visual boundary.
ChatMessageListDensity
Side-by-side comparison of compact, balanced, and spacious densities. Use compact in sidebars or panels, balanced for most full-page chat, and spacious for long-form reading. Use gap when row spacing needs to differ from density.
ChatMessageMetadataFooter
Assistant message with footer actions: copy, retry, thumbs up/down, and model label. Use for AI responses that need feedback or utility controls.
ChatMessageMetadataShowcase
Three-message conversation showcasing error status with retry, delivery status, and full footer actions with model label.
ChatSendButtonCustomIcon
Send buttons with custom icons via sendIcon and stopIcon props. Use to match the personality of the chat experience: a paper airplane for messaging, sparkles for AI generation, or a check mark for confirmation flows.
ChatSendButtonStates
Disabled, ready, and streaming states at both sizes. The button automatically toggles between send (primary) and stop (secondary) based on streaming state.
ChatSystemMessageVariants
Default and divider variants side by side. Use default for inline status updates and divider for date separators or section breaks.
ChatSystemMessageWithIcon
System messages with a leading icon that reinforces the message type. Use icons to help users scan and identify message categories at a glance.
CitationInlineText
Citations embedded within a paragraph of text, showing how they flow inline with surrounding content.
CitationShowcase
All citation variants at a glance: label chips and numbered badges, with and without icons and links.
CitationSourceList
A list of citation sources with icons, as you might show at the end of an AI-generated response or article footer.
CodeAcrossTextSizes
Inline code rendered inside heading, body, supporting, and label text. Code automatically matches the font size of its parent text element.
CodeInlineInParagraph
Inline code references mixed within a paragraph of body text. Use Code to mark up function names, hooks, or API terms so they stand out from surrounding prose.
CodeShowcase
Inline code snippets inside a sentence showing how Code renders alongside body text.
CodeVariousContent
Inline code used for variables, terminal commands, CSS properties, file paths, and keyboard shortcuts. Shows how Code adapts to different kinds of technical content.
CollapsibleControlledAccordion
Manage the open section from parent state. Use when the open state needs to sync with a URL param, form, or external control.
CollapsibleDividedAccordion
FAQ-style accordion using the hasDividers prop on CollapsibleGroup: built-in row hairlines and density padding with zero custom CSS. Use for FAQs, settings lists, and nav sections.
CollapsibleHookUsage
Custom disclosure UI built directly with useCollapsible for headless open/close state.
CollapsibleMultipleAccordion
Several sections open at once. Use when users need to compare content across sections, like feature lists or pricing tiers.
CollapsibleShowcase
An accordion group with three collapsible sections in single mode: opening one closes the others.
CollapsibleSingleAccordion
Only one section open at a time. Use for settings pages or any list where expanding one item should close the others.
CollapsibleWithoutCard
Collapsible sections separated by dividers instead of cards. Use for inline disclosure in detail panels or sidebar content where cards would add too much weight.
CollapsibleGroupAccordion
An accordion built with type="single": opening one Collapsible automatically closes the others. Use defaultValue to pre-expand the most important section.
CommandPaletteCustomFooter
Command palette with a custom footer tip message.
CommandPalettePickerMode
Single-value picker with persistent selection and check indicator.
CommandPaletteRichItems
Custom item rendering with icons, keyboard shortcuts, and keyword search.
CommandPaletteEmptyBasic
A command palette with no results, showing a custom empty message via emptyBootstrapText. Use to explain why the palette is empty and what the user can do next.
CommandPaletteEmptyShowcase
Command palette empty state shown when no commands are available.
CommandPaletteFooterShowcase
Command palette footer with custom tip content.
CommandPaletteGroupShowcase
Command palette groups in both data-driven (auxiliaryData.group) and composed (CommandPaletteGroup + CommandPaletteItem) forms.
CommandPaletteItemShowcase
Command palette items with custom content via renderItem and as composed CommandPaletteItem with icons, highlighted, selected, and disabled states.
DateInputClearable
Date input with a clear button that resets the value. Use when the date field is optional and the user may need to undo their selection.
DateInputDateRange
Date input constrained to a min/max window. Use when only certain dates are valid, like booking availability or a fiscal quarter.
DateInputWithDescription
Date input with helper text below the label explaining what the field expects. Use when the purpose of the date is not obvious from the label alone.
DateInputWithValidation
Date input in all three status states: error, warning, and success. Use to surface validation issues, caution the user, or confirm a valid selection.
DateRangeInputWithPresets
Date range picker with quick-select presets for common periods. Use for analytics dashboards, report filters, or any context where users frequently select standard time windows.
DialogConfirmationDialog
Asks the user to confirm a destructive action before it happens. Use before deleting projects, removing team members, revoking API keys, or any irreversible operation.
DialogFullscreenDialog
Takes over the entire viewport for content that needs maximum space. Use for documentation viewers, rich text editors, multi-step wizards, or media previews where the standard dialog width is too narrow.
DialogScrollingContent
Constrains the dialog height and scrolls the body when content overflows. Use for terms and conditions, license agreements, changelogs, or any long-form content the user needs to review before accepting.
DialogShowcase
Modal dialog with a header, body content, and close button.
DialogWithSubtitle
Cannot be dismissed by Escape or backdrop click; the user must explicitly choose an action. Uses purpose="required". Use for ownership transfers, legal acknowledgements, or critical decisions where skipping is not an option.
DialogHeaderBasic
A DialogHeader with a title, subtitle, and close button, placed in the header slot of a Dialog Layout. Pass onOpenChange to render the close button.
DividerFullBleed
Divider that extends past container padding to span the full width. Use inside cards or panels when you want a clean edge-to-edge separation, like between an order summary and total.
DividerVariants
Subtle, labeled, and strong dividers in a single card. Use subtle between related sections, labeled for alternatives like "or", and strong for high-contrast boundaries.
DividerVertical
Vertical dividers separating side-by-side metrics. Use between stat cards, toolbar groups, or any horizontal layout where you need a visual boundary between sections.
DropdownMenuActions
Action menu with dividers separating safe and destructive operations. Use for row-level actions on items like documents, projects, or records.
DropdownMenuNoChevron
Overflow menu triggered by an icon-only button with no chevron or label text. Use for row-level actions in tables, cards, or lists where a text button would take too much space.
DropdownMenuWithDisabledItems
Menu with selectively disabled items based on permissions. Use when some actions require higher privileges, like admin-only operations.
DropdownMenuWithSections
Menu items organized into titled sections for easy scanning. Use when you have 6+ actions that fall into distinct categories, like Create vs Manage.
FieldRequired
Required and optional field indicators side by side. Use isRequired on fields the user must fill in, and isOptional to clarify which fields can be skipped.
FieldWithDescription
Fields with helper text below the label. Use descriptions to explain format requirements, constraints, or what happens with the data, like "At least 8 characters" or "We will send a confirmation link".
GridDashboardLayout
Dashboard layout with mixed-size widgets and a full-width summary row
GridGalleryExample
Card gallery with responsive columns that maintain consistent widths
GridResponsiveAutoFit
Responsive grid where cards stretch to fill remaining space
GridWithGridSpan
Grid with featured items spanning multiple columns and rows
GridSpanColumns
Grid items spanning two of three columns. Wrap a grid child in GridSpan to make it occupy multiple columns for asymmetric layouts.
HStackShowcase
Demonstrates HStack arranging items horizontally with different gaps and alignments.
HeadingCardGrid
Responsive card grid with truncated headings and descriptions for uniform layout
HeadingPageLayout
Real-world page layout demonstrating heading levels h1 through h3 with supporting text
HeadingShowcase
useKeyboardHintHookUsage
Toolbar shows an ephemeral "← → to navigate" hint on first keyboard focus via useKeyboardHint, teaching sighted keyboard users that arrows move within the group.
useStreamingTextHookUsage
Smooth bursty generated text into a steady reveal with useStreamingText.
HoverCardHookUsage
Custom profile preview using useHoverCard with direct trigger and render control.
HoverCardInlineTextHoverCard
Shows a term definition on hover within a paragraph. Use for technical terms, jargon, or concepts that some readers may not know, like a glossary built into the text.
HoverCardInteractiveContent
Shows a page summary when hovering a link: title, description, and URL. Use for documentation links, article references, or any URL where a preview helps the user decide whether to click.
HoverCardProfileHoverCard
Shows a user profile summary on hover with name, role, and bio. Use on usernames, avatars, or mentions to let users preview a profile without navigating away.
HoverCardShowcase
A hover card that shows a user profile preview when hovering over a trigger button. Starts open for preview.
IconNonSemanticColors
Non-semantic color palette for icons.
IconSemanticColors
All semantic icon color variants with labels.
IconSizes
All icon sizes from extra-small to large.
IconStatusIcons
Status list using semantic icons for success, warning, error, and info.
ItemBasicItem
A basic item with a label, supporting description, and end-aligned timestamp. Use this for simple rows that need consistent text alignment and spacing.
ItemShowcase
ItemWithMedia
Items with leading avatars and icons in the startContent slot. Keep start content small so the row stays compact and easy to scan.
ItemWithMetadata
Items with end-aligned metadata and badges. Use the endContent slot for counts, status, timestamps, and other secondary row information.
KbdInlineInstructions
Keyboard shortcuts rendered inline within instructional text
KbdModifierCombos
Modifier combinations and special keys rendered as shortcut badges
LayerHookUsage
Low-level anchored overlay rendered with useLayer and a custom surface.
LayoutBasicCardLayout
A card layout with header, scrollable content area, and footer with action buttons.
LayoutContentOnlyLayout
A minimal layout with just a content area inside a card, without header or footer.
LayoutContentWidth
A layout using contentWidth to constrain and center content while keeping dividers full-bleed.
LayoutDualPanelLayout
A file browser style layout with start panel for folders, main content for files, and end panel for details.
LayoutFullBleedContent
A layout where content extends edge-to-edge with zero padding, ideal for tables or images.
LayoutShowcase
LayoutSidebarLayout
A settings page layout with a navigation sidebar panel, content area, header, and footer.
LayoutContentBasic
A scrollable main content area below a fixed header. Use LayoutContent inside Layout to get automatic padding and scroll containment for the primary content.
LinkInlineLink
A link embedded within a paragraph of body text.
ListItemWithMetadata
List items with end-aligned metadata. Use endContent for badges, counts, timestamps, and compact status details.
MediaThemeImageOverlay
A common image card pattern: place text and actions over a dark gradient and wrap the overlay content in MediaTheme mode="dark".
MediaThemeLightScrim
A light scrim over an image. Use MediaTheme mode="light" so text and ghost buttons use dark-on-light tokens.
MediaThemeShowcase
A compact media overlay showing MediaTheme adapting text, icons, badges, and button variants over an image-backed dark surface.
MobileNavToggleBasic
A nav toggle with a custom icon and accessible label instead of the default hamburger. It opens a MobileNav drawer via the AppShell mobile context, which AppShell provides automatically.
OutlineControlled
Drive the active section yourself with activeId and onActiveIdChange. Providing activeId disables the built-in scroll-spy so your own logic owns the highlight.
OutlineDensity
Two density variants control item padding. Use compact for dense sidebars and default for standard documentation layouts. The sliding indicator automatically matches each item height.
OverlayBottomStrip
Places compact supporting content in a bottom scrim strip without covering the entire image.
OverlayShowcase
A media card with an always-visible scrim and centered action content.
PaginationDotsCarousel
A review carousel using dot pagination to step through testimonial cards. Use the dots variant for carousels, galleries, and any paged content where the total is small and visible position matters more than a page number.
PaginationPageSize
A transactions table with pagination and a page size dropdown at the bottom. Shows how pagination works as a footer below real content, with adjustable rows per page.
PopoverConfirmAction
Inline confirmation popover for destructive actions with delete and cancel buttons.
PopoverFilterPanel
Popover with checkbox filters and apply/reset actions.
PopoverHookUsage
Custom quick-actions popover using usePopover for trigger refs, ARIA attributes, and focus trapping.
PopoverKeyboardShortcuts
Popover displaying a list of keyboard shortcuts with key and description pairs.
PopoverSettingsPanel
Popover with toggle switches for managing user preferences like notifications, dark mode, and sounds.
PopoverShowcase
ProgressBarCustomFormat
Progress bar with a custom value label showing disk usage in GB.
RadioListPricingTier
Radio list with pricing info in end content for plan selection.
ResizableShowcase
Horizontal resizable split with a draggable handle between two panels.
ResizableSidebar
A collapsible sidebar with snap points, driven by useResizable. Dragging snaps to preset widths, dragging past the minimum collapses the panel, and the expand method restores it programmatically.
SectionVariants
All three background variants stacked: section (default surface), muted, and transparent. A quick visual reference for choosing the right variant.
SectionWashHighlight
A default section stacked with a full-width muted section. Shows how muted draws attention to a specific region like an upgrade prompt or banner.
SectionWithDividers
Adjacent sections separated by bottom dividers, like a settings page. Use dividers when stacking same-variant sections that need visual separation without a background change.
SideNavEndContent
Side navigation items with badges, counts, and context menus as trailing content.
SpinnerWithLabel
Spinners with text and rich multi-line labels.
StackAlignment
Buttons positioned at the start, center, and end of a row.
StackDirections
Badges arranged horizontally and vertically in side-by-side cards.
StackFillItem
An avatar, text, and button in a row; the text stretches to fill the available space.
StackItemFill
A static-width item next to one that fills the remaining space. Wrap stack children in StackItem when an item needs explicit sizing control.
StatusDotStatusIndicators
Labeled status dot list for presence indicators like online, away, and offline.
SyntaxThemeShowcase
A concise code block rendered with the One Dark Pro syntax preset to show how SyntaxTheme changes highlighting colors without making the page long.
TableColumnSettingsTable
Table with a column visibility picker in the toolbar. Toggle columns on and off.
TableInCard
Table composed inside a card with a heading, demonstrating container bleed alignment.
TextColors
All text color options (primary, secondary, disabled, placeholder, active) applied to body text to show their intended use.
TextHeadingLevels
All 6 heading levels (h1 through h6) rendered with Heading to show the full type scale.
TextInline
Mixing body and code text inline within a single line using the default inline display mode.
TextShowcase
TextTruncation
Single-line and multi-line text truncation with ellipsis using maxLines in a width-constrained container.
TextTypes
All 5 semantic text types (body, large, label, supporting, code) with their default styling from the theme.
TextWeight
The 4 font weight variants (normal, medium, semibold, bold) applied to body text.
TextWordBreak
Compares break-word and break-all word break modes on a long unbreakable string.
TextWrap
The 4 text-wrap modes (wrap, nowrap, balance, pretty) shown in width-constrained containers.
ThemeApply
Wrap a subtree in Theme to apply a theme to every child component in that region.
ThemeNested
Nested Theme providers let a local region use a different theme without affecting the rest of the page.
ThemeShowcase
Two visually distinct theme providers wrapping identical content to show how Theme changes the visual treatment of child components.
ThemeSwitcher
Use state to switch the theme object passed to Theme and preview a different visual treatment.
useThemeHookUsage
Read resolved theme token values with useTheme for non-CSS consumers like SVG charts.
ThumbnailDisabled
Thumbnails in the disabled state with reduced opacity. The remove button and click handler are suppressed when disabled.
ThumbnailGallery
A row of clickable thumbnails with labels that open a detail view. Use for image attachment lists where users need to preview and manage uploads.
ThumbnailRemovable
Thumbnails with a remove button overlay. The close button uses APCA luminance detection to stay visible on both dark and light images.
ThumbnailStates
All visual states side by side: image loaded, placeholder, skeleton loading, and upload overlay. Demonstrates the full lifecycle of a thumbnail from empty to loaded.
TimeInputFormats
12-hour, 24-hour, and seconds formats side by side. Use 12h for US-centric UIs, 24h for international or technical contexts, and seconds for precise timing.
TimestampAutoFormat
Auto format that shows relative time for recent dates and switches to the full date for older ones. The default choice for most use cases.
TimestampColors
Timestamp rendered in each available color variant: primary, secondary, disabled, and active.
TimestampFormats
All display formats side by side: date, date_time, time, and their system equivalents. Use date and date_time for user-facing UI, system variants for logs and dev tools.
TimestampRelativeFormat
Relative time labels from seconds to months ago, with hover tooltips showing the full date. Use in feeds, comment threads, and activity logs.
TimestampTimezone
Timestamps with the timezone abbreviation appended. Enable isTimezoneShown for audiences across time zones, like audit logs or team calendars.
ToastAction
Persistent toasts with a trailing button or link so the user can act on the notification, like undoing a delete or viewing a report.
ToastDeduplication
Prevent duplicate toasts with uniqueID. Use ignore to keep the first toast, or overwrite to replace it with updated content like a progress percentage.
ToastDismiss
Show a persistent toast and dismiss it programmatically using the function returned by useToast. Use for long-running operations that need manual cleanup.
ToastStacking
Multiple toasts stacking vertically with smooth enter and exit animations. Click repeatedly to see how toasts queue and dismiss.
ToastTypes
Info and error toast variants side by side. Info toasts auto-dismiss after 5 seconds, error toasts persist until the user dismisses them.
ToggleButtonColor
Toggle buttons with colored icons in the pressed state. Shows accent-colored toolbar formatting and semantic reaction colors (yellow star, red heart, blue bookmark).
ToggleButtonGroup
Toggle button groups in single-select and multi-select modes. Single selection acts as a view mode switcher; multiple selection forms a formatting toolbar.
ToggleButtonIconSwap
Icon-only toggle buttons that swap between outline and solid icons when pressed. Use for actions like favorite, bookmark, or mute where the icon itself communicates the state.
ToggleButtonLabel
Toggle buttons with visible text labels that show a font weight shift on press. Use when the icon alone is not enough to communicate the action.
ToggleButtonStates
Default, pressed, disabled, and loading states of a standalone toggle button. Shows how visual treatment changes across states.
ToggleButtonGroupVertical
A vertically stacked ToggleButtonGroup using the vertical orientation, shown with both single-select and multi-select behavior, ideal for sidebar-style option lists and vertical toolbars.
TokenClickable
Interactive tokens that respond to clicks. Use for toggleable filters or tokens that open a detail view when selected.
TokenColors
All 11 color variants in default and disabled states. Use color to categorize entities or convey status at a glance.
TokenEndContent
Tokens with trailing content like a count badge or status indicator after the label. Use for notification counts, item quantities, or compact status info.
TokenIcon
Tokens with a leading icon that identifies the entity type. Use when the icon helps users recognize the token category faster, like a user icon for people or a tag icon for labels.
TokenRemovable
Tokens with a dismiss button for selections the user can undo. Use in multi-select fields, active filters, or any list of user-chosen items.
TokenizerClear
Tokenizer with a built-in clear-all button for bulk removal of all selected tokens.
TokenizerCreatable
Free-text tokenizer for creating custom tags and a combined create-or-search pattern. Use when users need to enter values that may not exist in a predefined list.
TokenizerEndContent
Tokenizer with an action button in the end slot. Use for inline actions like applying selections alongside the input.
TokenizerIcon
Tokenizer with a leading search icon to visually reinforce the search behavior.
TokenizerMaxEntries
Tokenizer with a maximum selection limit. The input hides automatically when the limit is reached, preventing further additions.
TokenizerOverflow
Tokenizer with overflow truncation when unfocused. Inline mode pushes content down on expand; layer mode overlays without shifting layout.
ToolbarCardHeader
A toolbar as a card header with a left-aligned title and icon actions on the right. Use Toolbar instead of LayoutHeader when your card header has interactive actions; Toolbar adds start/end slot layout, keyboard navigation, and automatic size cascading. If the header is just a title with no actions, a LayoutHeader or Section is enough.
ToolbarSizes
Small, medium, and large toolbars side by side. The size prop cascades to child buttons and inputs automatically. Use small in dense UIs like cards, medium for most cases, and large for spacious layouts.
ToolbarThreeSlot
A toolbar with start, center, and end content using the three-column grid layout. Use when you need a centered title or heading with navigation and actions on either side.
TooltipInlineTextTooltips
Tooltips on inline text terms for definitions.
VStackBasic
A heading and paragraphs stacked vertically with a consistent gap. Use VStack whenever siblings should flow top to bottom with even spacing.
VStackShowcase
Demonstrates VStack arranging items vertically with different gaps.
VisuallyHiddenLiveRegion
A polite aria-live region announces visual-only state changes to assistive technology.
VisuallyHiddenShowcase
VisuallyHiddenStructuralHeading
Give a visually implicit section an accessible name so screen-reader users can navigate to it.
VisuallyHiddenSupplementaryContext
Add screen-reader-only context to terse visual data, like spelling out what a trend arrow means.

---

# Skeleton

An animated shimmer placeholder that previews the shape of content while it loads. Use it to build loading screens that match the layout of the real content. For content with unknown dimensions, use Spinner instead.

**Import:** `import {Skeleton} from '@astryxdesign/core/Skeleton';`

## Best Practices

- **Do:** Match the size and shape of the content being loaded to create a realistic placeholder.
- **Do:** Stagger multiple skeletons with the `index` prop for a natural wave animation.
- **Don't:** Use when the content dimensions are unknown; use Spinner instead.
- **Don't:** Combine with a Spinner on the same content area; pick one loading pattern.
- **Don't:** Show skeletons indefinitely; if loading takes too long, show an error or empty state instead.

## Props

| Prop     | Type                                           | Default  | Description                                                                                         |
| -------- | ---------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------- |
| `width`  | `number \| string`                             | `'100%'` | Width in pixels (number) or CSS value (string).                                                     |
| `height` | `number \| string`                             | `'100%'` | Height in pixels (number) or CSS value (string).                                                    |
| `radius` | `'none' \| 0 \| 1 \| 2 \| 3 \| 4 \| 'rounded'` | `3`      | Border radius using design tokens. none for sharp, 0-4 for scale, rounded for pills.                |
| `index`  | `number`                                       | `0`      | Index for staggered animation timing. Element at index n starts at DELAY_TIME + (STAGGER_TIME × n). |

## Theming

| Component class   | Preferred data attributes | Props | States |
| ----------------- | ------------------------- | ----- | ------ |
| `astryx-skeleton` | —                         | —     | —      |

Override in defineTheme:

```ts
components: {
  'skeleton': {
    base: { /* CSS properties */ },
  },
}
```

Related block templates:

AspectRatioWithSkeleton
Aspect ratio container with a skeleton loading placeholder.
SkeletonCardSkeleton
Card skeleton with avatar, name, and content lines.
SkeletonShowcase
A skeleton loading placeholder.
SkeletonStaggeredList
Staggered skeleton lines with varying widths.
SkeletonTableRowSkeleton
Table skeleton with staggered column widths.

---

# Selector

A dropdown selector for choosing a single value from a list of options. Supports labels, validation, descriptions, and required/optional states. Use it in forms and settings when presenting a moderate number of options.

**Import:** `import {Selector} from '@astryxdesign/core/Selector';`

## Anatomy

| Element     | Required | Description                                            |
| ----------- | -------- | ------------------------------------------------------ |
| Label       | No       | Text label displayed above the selector.               |
| Placeholder | No       | Hint text shown when no value is selected.             |
| Description | No       | Helper text providing additional context.              |
| Left Icon   | No       | Icon displayed to the left of the selected value.      |
| Value       | Yes      | The currently selected item displayed in the selector. |
| List        | Yes      | The dropdown list of selectable options.               |

## Best Practices

- **Do:** Provide a visible label so users understand what they are selecting.
- **Do:** Use sections and dividers to organize options when the list exceeds ~8 items.
- **Do:** renderOption for custom rows; do not pass SelectorOption as JSX children.
- **Do:** Set a meaningful placeholder that hints at the expected selection (e.g. "Choose a country" not "Select...").
- **Do:** Use inside InputGroup only when the selector needs a short prefix or suffix addon.
- **Don't:** Use for action menus; use Dropdown Menu for triggering commands or navigation.
- **Don't:** Use when there are only two options; use a SegmentedControl or radio buttons instead.
- **Don't:** Use Selector for navigation; links should be links, not dropdown options.
- **Don't:** Use for yes/no or on/off choices; use Switch or CheckboxInput instead.
- **Don't:** Put more than ~20 options without sections; consider Typeahead for large lists.
- **Don't:** Wrap a disabled Selector in Tooltip to explain why it is disabled; disabled triggers swallow the hover events the wrapper needs. Use the disabledMessage prop instead.

## Props

| Prop                | Type                                                          | Default       | Description                                                                                                                                                                                                                                                                                                      |
| ------------------- | ------------------------------------------------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `label`             | `string`                                                      | —             | Label text for accessibility. **(required)**                                                                                                                                                                                                                                                                     |
| `options`           | `SelectorOption[]`                                            | —             | Array of items: strings, objects with value/label/icon/disabled, dividers ({type: "divider"}), or sections ({type: "section", title, items}). **(required)**                                                                                                                                                     |
| `value`             | `string`                                                      | —             | Currently selected value.                                                                                                                                                                                                                                                                                        |
| `onChange`          | `(value: string) => void`                                     | —             | Callback fired when the selection changes.                                                                                                                                                                                                                                                                       |
| `hasClear`          | `boolean`                                                     | `false`       | Shows a clear (×) button when a value is selected. When true, onChange also accepts null to signal the user cleared the selection.                                                                                                                                                                               |
| `hasSearch`         | `boolean`                                                     | `false`       | Whether to show a search input for filtering options. As the user types, the match count (or "No results found") is announced to screen readers via a polite live region.                                                                                                                                        |
| `searchPlaceholder` | `string`                                                      | `'Search...'` | Placeholder text for the search input.                                                                                                                                                                                                                                                                           |
| `placeholder`       | `string`                                                      | `'Select...'` | Placeholder text shown when no value is selected.                                                                                                                                                                                                                                                                |
| `size`              | `'sm' \| 'md' \| 'lg'`                                        | `'md'`        | Size variant for the selector.                                                                                                                                                                                                                                                                                   |
| `isDisabled`        | `boolean`                                                     | `false`       | Disables the selector.                                                                                                                                                                                                                                                                                           |
| `htmlName`          | `string`                                                      | —             | The HTML name attribute for form submissions. Renders a hidden input carrying the selected value, like a native select.                                                                                                                                                                                          |
| `disabledMessage`   | `string`                                                      | —             | Explains why the selector is disabled. With isDisabled, shows a tooltip on hover/keyboard focus and keeps the trigger focusable via aria-disabled (activation stays blocked). Use this instead of wrapping a disabled Selector in Tooltip. Disabled controls swallow the hover events an external Tooltip needs. |
| `isLabelHidden`     | `boolean`                                                     | `false`       | Visually hides the label while keeping it accessible.                                                                                                                                                                                                                                                            |
| `description`       | `string`                                                      | —             | Helper text displayed below the label.                                                                                                                                                                                                                                                                           |
| `isOptional`        | `boolean`                                                     | `false`       | Marks the field as optional.                                                                                                                                                                                                                                                                                     |
| `isRequired`        | `boolean`                                                     | `false`       | Marks the field as required.                                                                                                                                                                                                                                                                                     |
| `status`            | `{type: 'error' \| 'warning' \| 'success', message?: string}` | —             | Validation status with an optional message.                                                                                                                                                                                                                                                                      |
| `renderOption`      | `(option: SelectorOptionData) => ReactNode`                   | —             | Custom render function for each selectable option in the dropdown. Use this instead of JSX children; dividers and sections are rendered by the selector.                                                                                                                                                         |
| `xstyle`            | `StyleXStyles`                                                | —             | StyleX styles for layout customization (margins, positioning, sizing). Must be a stylex.create() value: not an inline style object like style={{}}.                                                                                                                                                              |

## Components

### SelectorOption

See `npx astryx component SelectorOption` for props and usage.

## Theming

| Component class          | Preferred data attributes  | Props        | States |
| ------------------------ | -------------------------- | ------------ | ------ |
| `astryx-selector`        | `data-size`, `data-status` | size, status | —      |
| `astryx-selector-option` | —                          | —            | —      |

Override in defineTheme:

```ts
components: {
  'selector': {
    base: { /* CSS properties */ },
    'size:value': { /* variant-specific */ },
  },
  'selector-option': {
    base: { /* CSS properties */ },
  },
}
```

Related block templates:

FormLayoutHorizontalLabels
Settings form with labels placed beside their inputs
FormLayoutMixedControls
Form with different control types: text input, selector, and checkboxes
SelectorClearable
Selector with a clear button to reset the selected value.
SelectorShowcase
SelectorWithSections
Selector with options grouped into labeled sections.
SelectorWithStatus
Selector showing error, warning, and success validation states.
SelectorOptionBasic
A selector whose options are rendered with SelectorOption, adding a secondary description below each label. Use inside renderOption for consistent custom option styling.
SelectorOptionShowcase
Selector with custom-rendered options using SelectorOption for icons and descriptions.
ThemeSwitcher
Use state to switch the theme object passed to Theme and preview a different visual treatment.
ToolbarTableFilter
A compact toolbar with a search input, Status and Priority filter selectors, and an overflow menu. Use above a data table to let users search, filter, and access view options.

---

# MultiSelector

A checkbox dropdown for selecting multiple values from a list. Selected items can display as a count, labels, or badges. Use it for filtering or when presenting a finite set of options where multiple choices are needed.

**Import:** `import {MultiSelector} from '@astryxdesign/core/MultiSelector';`

## Best Practices

- **Do:** Use for a moderate, finite set of options where multiple choices are needed.
- **Do:** Enable search filtering when the list exceeds ~15 options.
- **Do:** renderOption for custom rows; checkbox affordance stays owned by MultiSelector.
- **Do:** Enable select-all when most users will want all or nearly all options selected.
- **Do:** Use inside InputGroup only for a short prefix or suffix addon; prefer count or labels trigger display so the group stays single-line.
- **Don't:** Use for single-value selection; use Selector instead.
- **Don't:** Show more than ~20 options without enabling search.
- **Don't:** Wrap a disabled MultiSelector in Tooltip to explain why it is disabled; disabled triggers swallow the hover events the wrapper needs. Use the disabledMessage prop instead.

## Components

### MultiSelector

checkbox multi-select dropdown

| Prop                | Type                                                          | Default        | Description                                                                                                                         |
| ------------------- | ------------------------------------------------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `label`             | `string`                                                      | —              | a11y label **(required)**                                                                                                           |
| `options`           | `MultiSelectorOptionType[]`                                   | —              | items: strings, objects w/ value/label/icon/disabled, dividers, sections **(required)**                                             |
| `value`             | `string[]`                                                    | —              | selected values **(required)**                                                                                                      |
| `onChange`          | `(value: string[]) => void`                                   | —              | callback on selection change **(required)**                                                                                         |
| `changeAction`      | `(value: string[]) => void \| Promise<void>`                  | —              | async; fires after onChange                                                                                                         |
| `placeholder`       | `string`                                                      | `'Select...'`  | text when nothing selected                                                                                                          |
| `size`              | `'sm' \| 'md' \| 'lg'`                                        | `'md'`         | size variant                                                                                                                        |
| `triggerDisplay`    | `'count' \| 'labels' \| 'badges'`                             | `'count'`      | how to show selected in trigger                                                                                                     |
| `maxBadges`         | `number`                                                      | `3`            | max badges before "+N"; badges mode only                                                                                            |
| `hasSelectAll`      | `boolean`                                                     | —              | show select-all checkbox                                                                                                            |
| `selectAllLabel`    | `string`                                                      | `'Select all'` | select-all label                                                                                                                    |
| `hasSearch`         | `boolean`                                                     | —              | show search input                                                                                                                   |
| `searchPlaceholder` | `string`                                                      | `'Search...'`  | search placeholder                                                                                                                  |
| `isDisabled`        | `boolean`                                                     | —              | disables selector                                                                                                                   |
| `htmlName`          | `string`                                                      | —              | HTML name attr; one hidden input per selected value.                                                                                |
| `disabledMessage`   | `string`                                                      | —              | why disabled; w/ isDisabled shows tooltip on hover/focus, trigger stays focusable via aria-disabled; use instead of Tooltip wrapper |
| `isLabelHidden`     | `boolean`                                                     | —              | visually hides label                                                                                                                |
| `description`       | `string`                                                      | —              | helper text below label                                                                                                             |
| `isOptional`        | `boolean`                                                     | —              | marks optional                                                                                                                      |
| `isRequired`        | `boolean`                                                     | —              | marks required                                                                                                                      |
| `isLoading`         | `boolean`                                                     | —              | spinner in trigger                                                                                                                  |
| `status`            | `{type: 'error' \| 'warning' \| 'success', message?: string}` | —              | validation status w/ optional message                                                                                               |
| `renderOption`      | `(option: MultiSelectorOptionData) => ReactNode`              | —              | custom render fn per selectable option; not dividers/sections/select-all                                                            |
| `xstyle`            | `StyleXStyles`                                                | —              | StyleX layout styles; stylex.create() only                                                                                          |

## Theming

| Component class         | Preferred data attributes  | Props        | States |
| ----------------------- | -------------------------- | ------------ | ------ |
| `astryx-multi-selector` | `data-size`, `data-status` | size, status | —      |

Override in defineTheme:

```ts
components: {
  'multi-selector': {
    base: { /* CSS properties */ },
    'size:value': { /* variant-specific */ },
  },
}
```

Related block templates:

MultiSelectorColumnVisibilitySelector
Column visibility toggle with hidden label, search, select-all, and selection count.
MultiSelectorForm
Two multi-selectors in a form with required/optional states.
MultiSelectorSearchableMultiSelector
Multi-select with search filtering and select-all.
MultiSelectorSectionedMultiSelector
Multi-select with options grouped into labeled sections.
MultiSelectorShowcase
TableColumnSettingsTable
Table with a column visibility picker in the toolbar. Toggle columns on and off.

---

# Toast

Brief non-blocking notification for action confirmations and temporary info. Use where user needs feedback not decisions: saves, deletes, status changes. useToast() hook for production (positioning, stacking, auto-dismiss, dedup via ToastViewport). Toast renders inline for previews/docs/static showcases.

**Import:** `import {Toast} from '@astryxdesign/core/Toast';`

## Anatomy

| Element        | Required | Description                                                                     |
| -------------- | -------- | ------------------------------------------------------------------------------- |
| Body           | Yes      | The primary message text describing what happened or what the user should know. |
| End content    | No       | A trailing action like an Undo button or a link, placed after the body text.    |
| Dismiss button | Yes      | A close button that lets the user manually dismiss the toast before auto-hide.  |

## Best Practices

- **Do:** Short messages, a few words: "Changes saved", "Message sent".
- **Do:** Undo action in endContent for reversible ops like deletes.
- **Do:** uniqueID to dedup repeated action toasts.
- **Do:** Error type for failures needing attention; persists until dismissed.
- **Don't:** Don't use for critical blocking errors. Use Banner for persistent in-context messaging.
- **Don't:** Don't put long/multi-line content; disappears in 5s, user may not finish reading.
- **Don't:** Don't show form validation errors. Use inline field validation instead.

## Props

| Prop                | Type                                   | Default       | Description                                                   |
| ------------------- | -------------------------------------- | ------------- | ------------------------------------------------------------- |
| `body`              | `ReactNode`                            | —             | primary message content **(required)**                        |
| `type`              | `'info' \| 'error'`                    | `'info'`      | toast type; controls bg color; error persists until dismissed |
| `isAutoHide`        | `boolean`                              | —             | auto-dismiss; true for info, false for error                  |
| `autoHideDuration`  | `number`                               | `5000`        | ms before auto-dismiss                                        |
| `endContent`        | `ReactNode`                            | —             | trailing end content (undo btn, link)                         |
| `uniqueID`          | `string`                               | —             | unique id for dedup                                           |
| `collisionBehavior` | `'overwrite' \| 'ignore'`              | `'overwrite'` | behavior when matching uniqueID exists                        |
| `onHide`            | `(reason: "auto" \| "manual") => void` | —             | callback when toast removed                                   |

## Theming

| Component class | Preferred data attributes | Props | States |
| --------------- | ------------------------- | ----- | ------ |
| `astryx-toast`  | `data-type`               | type  | —      |

Override in defineTheme:

```ts
components: {
  'toast': {
    base: { /* CSS properties */ },
    'type:value': { /* variant-specific */ },
  },
}
```

Related block templates:

ToastAction
Persistent toasts with a trailing button or link so the user can act on the notification, like undoing a delete or viewing a report.
ToastDeduplication
Prevent duplicate toasts with uniqueID. Use ignore to keep the first toast, or overwrite to replace it with updated content like a progress percentage.
ToastDismiss
Show a persistent toast and dismiss it programmatically using the function returned by useToast. Use for long-running operations that need manual cleanup.
ToastShowcase
Imperative toast notifications triggered with useToast and rendered in the toast viewport.
ToastStacking
Multiple toasts stacking vertically with smooth enter and exit animations. Click repeatedly to see how toasts queue and dismiss.
ToastTypes
Info and error toast variants side by side. Info toasts auto-dismiss after 5 seconds, error toasts persist until the user dismisses them.

---

# Tooltip

A short text hint that appears on hover or focus, anchored to a trigger element. Use it to describe icon-only buttons, show the full text of truncated labels, or provide supplementary context without cluttering the UI.

**Import:** `import {Tooltip} from '@astryxdesign/core/Tooltip';`

## Best Practices

- **Do:** Keep tooltip content concise: aim for under 140 characters of plain text.
- **Do:** Add a tooltip to icon-only buttons and controls that lack a visible label.
- **Don't:** Place interactive elements like links or buttons inside a tooltip; use HoverCard or Popover instead.
- **Don't:** Use tooltips for essential information that users must see to complete a task.

## Components

### Tooltip

Component wrapper for tooltip display on hover/focus.

| Prop                 | Type                                     | Default    | Description                                                                                                |
| -------------------- | ---------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------- |
| `children`           | `ReactNode`                              | —          | Trigger element(s) that activate tooltip.                                                                  |
| `anchorRef`          | `RefObject<HTMLElement>`                 | —          | External anchor ref for sibling mode.                                                                      |
| `content`            | `ReactNode`                              | —          | Tooltip content, typically short text.                                                                     |
| `placement`          | `'above' \| 'below' \| 'start' \| 'end'` | `'above'`  | Position relative to anchor. Logical: start/end follow the popover's inherited direction (RTL mirrors).    |
| `alignment`          | `'start' \| 'center' \| 'end'`           | `'center'` | Alignment along placement axis. Logical: start/end follow the popover's inherited direction (RTL mirrors). |
| `delay`              | `number`                                 | `200`      | Show delay in ms.                                                                                          |
| `hideDelay`          | `number`                                 | `0`        | Hide delay in ms.                                                                                          |
| `focusTrigger`       | `'auto' \| 'always' \| 'never'`          | `'auto'`   | Controls when focus events trigger tooltip.                                                                |
| `isEnabled`          | `boolean`                                | `true`     | Enables/disables tooltip triggers.                                                                         |
| `onOpenChange`       | `(isOpen: boolean) => void`              | —          | Callback when visibility changes; true=shown, false=hidden.                                                |
| `hasHoverIndication` | `'auto' \| boolean`                      | `'auto'`   | Dashed underline on trigger element.                                                                       |
| `isDefaultOpen`      | `boolean`                                | —          | Show tooltip on mount. Still dismissible.                                                                  |

## Theming

| Component class  | Preferred data attributes | Props | States |
| ---------------- | ------------------------- | ----- | ------ |
| `astryx-tooltip` | —                         | —     | —      |

Override in defineTheme:

```ts
components: {
  'tooltip': {
    base: { /* CSS properties */ },
  },
}
```

Related block templates:

TooltipActionBarTooltips
Tooltips on an action button bar with contextual descriptions.
TooltipHookUsage
Tooltip using the useTooltip hook for programmatic control.
TooltipInlineTextTooltips
Tooltips on inline text terms for definitions.
TooltipShowcase

---

# TabList

TabList provides tab-style navigation for organizing content into categorized sections. Use it to let users switch between related views without leaving the page, with overflow items handled by a built-in "more" menu.

**Import:** `import {TabList} from '@astryxdesign/core/TabList';`

## Anatomy

| Element             | Required | Description                              |
| ------------------- | -------- | ---------------------------------------- |
| Left Content        | No       | Most important area; hugs content width. |
| Center-Fill Content | No       | Stretches to fill available space.       |
| Right Content       | No       | Hugs content width.                      |

## Best Practices

- **Do:** Keep tab labels short and descriptive so users can quickly scan available sections.
- **Do:** Use TabMenu to group overflow items when horizontal space is limited rather than scrolling tabs off-screen.
- **Do:** When using hasDivider with action buttons alongside tabs, match the Button size to the TabList size (both md, both sm); the divided tab strip reserves space so tabs and same-size buttons align to a shared baseline above the rail.
- **Don't:** Use tabs for sequential steps or workflows; use a stepper or wizard pattern instead.
- **Don't:** Place more than 6–8 visible tabs before the overflow menu; prioritize the most important categories.
- **Don't:** Confuse TabList with SegmentedControl or ToggleButton. TabList is for navigation between views. SegmentedControl and ToggleButton are input controls: SegmentedControl always has exactly one selected option, while ToggleButton can be toggled on or off.

## Props

| Prop          | Type                         | Default        | Description                                                                                                                                                                                                                         |
| ------------- | ---------------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `value`       | `string`                     | —              | The currently selected tab value. **(required)**                                                                                                                                                                                    |
| `onChange`    | `(value: string) => void`    | —              | Callback fired when a tab is selected. **(required)**                                                                                                                                                                               |
| `size`        | `'sm' \| 'md' \| 'lg'`       | `'md'`         | Size variant applied to all child tabs.                                                                                                                                                                                             |
| `layout`      | `'hug' \| 'fill'`            | `'hug'`        | Layout mode for tab sizing. 'hug': each tab hugs its content width. 'fill': tabs stretch equally to fill the container width.                                                                                                       |
| `hasDivider`  | `boolean`                    | `false`        | Whether to show a bottom border divider under the tab list.                                                                                                                                                                         |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Orientation of the tab strip, controlling which arrow keys move focus between tabs and the reported aria-orientation. 'horizontal': ArrowLeft/ArrowRight. 'vertical': ArrowUp/ArrowDown. Both axes' arrows are accepted regardless. |
| `children`    | `ReactNode`                  | —              | Tab and TabMenu items to render inside the nav. **(required)**                                                                                                                                                                      |
| `xstyle`      | `StyleXStyles`               | —              | StyleX styles for layout customization (margins, positioning, sizing). Must be a stylex.create() value: not an inline style object like style={{}}.                                                                                 |

## Components

### Tab

See `npx astryx component Tab` for props and usage.

### TabMenu

See `npx astryx component TabMenu` for props and usage.

## Theming

| Component class            | Preferred data attributes | Props | States   |
| -------------------------- | ------------------------- | ----- | -------- |
| `astryx-tab-list`          | `data-size`               | size  | —        |
| `astryx-tab`               | `data-selected`           | —     | selected |
| `astryx-tab-indicator`     | `data-selected`           | —     | selected |
| `astryx-tab-menu`          | —                         | —     | —        |
| `astryx-tab-menu-dropdown` | —                         | —     | —        |
| `astryx-tab-menu-item`     | —                         | —     | —        |

Override in defineTheme:

```ts
components: {
  'tab-list': {
    base: { /* CSS properties */ },
    'size:value': { /* variant-specific */ },
  },
  'tab': {
    base: { /* CSS properties */ },
    'selected': { /* state-specific */ },
  },
}
```

Related block templates:

TabShowcase
Tab is an individual tab item within a TabList, supporting labels, icons, selected icons, and end content slots.
TabWithSelectedIcon
A tab that changes its icon when selected.
TabListShowcase
TabListTabsFillLayout
Tabs that stretch to fill the available width with a bottom divider.
TabListTabsWithActions
Page header pattern with tabs on the left and action buttons pushed to the right. When hasDivider is true, match the Button size to the TabList size so the tabs and actions align to a shared baseline above the divider.
TabListTabsWithBadge
Tabs with notification badge counts rendered via endContent. Uses error variant for urgent counts and neutral for informational ones.
TabListTabsWithIcons
Tabs with leading icons alongside text labels.
TabListTabsWithMenu
Tab list with a dropdown menu for additional items that do not fit inline.
TabListTabsWithStatusDot
Tabs with status dot indicators rendered via endContent to show live environment health at a glance.
TabMenuBasic
An overflow menu at the end of a TabList that collects secondary tabs behind a dropdown. Use it when there are more tabs than fit comfortably inline.
TabMenuShowcase
TabMenu is an overflow menu within a TabList that groups additional tab options into a dropdown, showing the selected option's label as the trigger text.
ToolbarWithTabs
A toolbar with tabs in the start slot and an action button at the end. Use as a card or section header when content is split into tabs with a primary action alongside.

---

# Tab

Individual tab; renders as button or anchor w/ selected-state styling + optional icons.

**Import:** `import {Tab} from '@astryxdesign/core/TabList';`

## Props

| Prop            | Type                | Default | Description                                                                              |
| --------------- | ------------------- | ------- | ---------------------------------------------------------------------------------------- |
| `value`         | `string`            | —       | Unique value matched against TabListContext.value. **(required)**                        |
| `label`         | `string`            | —       | Accessible label; visible by default, aria-label when isLabelHidden. **(required)**      |
| `isLabelHidden` | `boolean`           | `false` | Visually hide label for icon-only tabs; label becomes aria-label.                        |
| `href`          | `string`            | —       | URL; renders as <a> when provided.                                                       |
| `as`            | `LinkComponentType` | —       | Custom link component overriding LinkProvider; only w/ href.                             |
| `icon`          | `ReactNode`         | —       | Icon shown when not selected.                                                            |
| `selectedIcon`  | `ReactNode`         | —       | Icon shown when selected; falls back to icon.                                            |
| `endContent`    | `ReactNode`         | —       | Content after the label (badge, status dot, etc.).                                       |
| `xstyle`        | `StyleXStyles`      | —       | StyleX styles for layout customization. Must be stylex.create() value, not inline style. |

Related block templates:

TabShowcase
Tab is an individual tab item within a TabList, supporting labels, icons, selected icons, and end content slots.
TabWithSelectedIcon
A tab that changes its icon when selected.
TabListTabsFillLayout
Tabs that stretch to fill the available width with a bottom divider.
TabListTabsWithActions
Page header pattern with tabs on the left and action buttons pushed to the right. When hasDivider is true, match the Button size to the TabList size so the tabs and actions align to a shared baseline above the divider.
TabListTabsWithBadge
Tabs with notification badge counts rendered via endContent. Uses error variant for urgent counts and neutral for informational ones.
TabListTabsWithIcons
Tabs with leading icons alongside text labels.
TabListTabsWithMenu
Tab list with a dropdown menu for additional items that do not fit inline.
TabListTabsWithStatusDot
Tabs with status dot indicators rendered via endContent to show live environment health at a glance.
TabMenuBasic
An overflow menu at the end of a TabList that collects secondary tabs behind a dropdown. Use it when there are more tabs than fit comfortably inline.
TabMenuShowcase
TabMenu is an overflow menu within a TabList that groups additional tab options into a dropdown, showing the selected option's label as the trigger text.

---

# Spinner

An animated loading indicator for processes with unknown duration, such as data fetching or form submission. Supports visible labels, multiple sizes, and a dark background variant. For content with known dimensions, use Skeleton instead.

**Import:** `import {Spinner} from '@astryxdesign/core/Spinner';`

## Best Practices

- **Do:** Provide a meaningful label to describe what is loading for screen reader users.
- **Do:** Use the "onMedia" shade when placed on dark or accent-colored backgrounds.
- **Don't:** Use for content areas with known dimensions; use Skeleton to preserve layout instead.
- **Don't:** Stack multiple spinners in the same view; use one to represent the overall loading state.

## Props

| Prop         | Type                                              | Default     | Description                                                                              |
| ------------ | ------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------- |
| `size`       | `'sm' \| 'md' \| 'lg'`                            | `'md'`      | Spinner size (10px, 14px, 18px).                                                         |
| `shade`      | `'default' \| 'onMedia' \| 'subtle' \| 'inherit'` | `'default'` | Color shade for light or dark backgrounds.                                               |
| `label`      | `ReactNode`                                       | —           | Visible content below spinner. String auto-sets aria-label.                              |
| `aria-label` | `string`                                          | `'Loading'` | A11y name for screen readers. Defaults to label or "Loading".                            |
| `xstyle`     | `StyleXStyles`                                    | —           | StyleX styles for layout customization. Must be stylex.create() value, not inline style. |

## Theming

| Component class  | Preferred data attributes | Props       | States |
| ---------------- | ------------------------- | ----------- | ------ |
| `astryx-spinner` | `data-size`, `data-shade` | size, shade | —      |

Override in defineTheme:

```ts
components: {
  'spinner': {
    base: { /* CSS properties */ },
    'size:value': { /* variant-specific */ },
  },
}
```

Related block templates:

SpinnerOnMedia
Default and onMedia shade spinners for light and dark backgrounds.
SpinnerShowcase
A large spinner indicator.
SpinnerSizes
All spinner sizes displayed side by side.
SpinnerWithLabel
Spinners with text and rich multi-line labels.

---

# Banner

Banner shows a persistent message at the top of a page or section. Use for form errors, system updates, maintenance notices, or success confirmations.

**Import:** `import {Banner} from '@astryxdesign/core/Banner';`

## Anatomy

| Element             | Required | Description                                                               |
| ------------------- | -------- | ------------------------------------------------------------------------- |
| Icon                | Yes      | Automatically set based on the status (info, warning, error, success).    |
| Title               | No       | The main message. Required if no description is provided.                 |
| Description         | No       | Additional detail below the title. Required if no title is provided.      |
| Action button       | No       | A button for the user to act on the message, like "Review" or "Retry".    |
| Dismiss button      | No       | Lets the user close the banner. Enabled by setting isDismissable.         |
| Collapsible content | No       | Extra detail that expands below the banner header, like a list of errors. |

## Best Practices

- **Do:** Match status to message: info for updates, warning for caution, error for problems, success for confirmations.
- **Do:** Card container for inline content, section container for full-width page-level messages.
- **Do:** Make info/success dismissable. Keep error banners until the issue is fixed.
- **Do:** Keep titles short: "Payment failed" not "There was a problem processing your payment."
- **Don't:** Use for auto-dismissing messages; use Toast instead.
- **Don't:** Stack multiple banners of the same status; combine into one.

## Props

| Prop                | Type                                          | Default  | Description                                                                                    |
| ------------------- | --------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------- |
| `status`            | `'info' \| 'warning' \| 'error' \| 'success'` | —        | controls icon+color **(required)**                                                             |
| `title`             | `ReactNode`                                   | —        | title text/ReactNode in header **(required)**                                                  |
| `description`       | `ReactNode`                                   | —        | text below title in header                                                                     |
| `icon`              | `ReactNode`                                   | —        | override default status icon                                                                   |
| `isDismissable`     | `boolean`                                     | `false`  | user can dismiss banner                                                                        |
| `onDismiss`         | `() => void`                                  | —        | dismiss callback; banner self-hides regardless                                                 |
| `endContent`        | `ReactNode`                                   | —        | end-aligned action in header, typically button/link                                            |
| `container`         | `'card' \| 'section'`                         | `'card'` | card=border-radius; section=full-width no radius for page-level                                |
| `children`          | `ReactNode`                                   | —        | content in card-bg area below colored header                                                   |
| `defaultIsExpanded` | `boolean`                                     | `false`  | Whether the content area (children) starts expanded. Only relevant when children are provided. |
| `xstyle`            | `StyleXStyles`                                | —        | StyleX layout customization via stylex.create()                                                |

## Theming

| Component class         | Preferred data attributes       | Props             | States |
| ----------------------- | ------------------------------- | ----------------- | ------ |
| `astryx-banner`         | `data-container`, `data-status` | container, status | —      |
| `astryx-banner-icon`    | `data-status`                   | status            | —      |
| `astryx-banner-content` | `data-container`, `data-status` | container, status | —      |

Override in defineTheme:

```ts
components: {
  'banner': {
    base: { /* CSS properties */ },
    'container:value': { /* variant-specific */ },
  },
  'banner-icon': {
    base: { /* CSS properties */ },
  },
}
```

Some properties are set via standard CSS in component overrides:

```ts
components: {
  banner: {
    base: {
      borderRadius: '...',
    },
  },
}
```

Related block templates:

AppShellWithBanner
Full layout with TopNav, SideNav, and a dismissable info banner between the nav and content.
BannerCollapsibleContent
Combine an action button, dismiss control, and expandable detail area in one banner. Use for complex notifications like config changes or deployment summaries.
BannerDismissable
Let the user close a banner after reading it. Use for maintenance notices, feature tips, or any non-critical message the user can acknowledge.
BannerSectionVariant
A full-width banner with no border radius for page-level notifications. Use at the top of a page for site-wide announcements or maintenance alerts.
BannerShowcase
All four status banners stacked: info, success, warning, and error. A quick visual reference for choosing the right status.
BannerStatuses
All 4 banner statuses: info, success, warning, and error. Use to show persistent messages like updates, confirmations, cautions, or problems at the top of a page or section.
BannerWithActionButton
Add a button to a banner so the user can act on the message. Use for trial expirations, payment failures, or anything that needs a response.

---

# List

A vertical collection of items with consistent spacing, dividers, and optional markers. Supports headers, icons, avatars, badges, and interactive items with click or link behavior. Use it to display ordered or unordered groups of related content.

**Import:** `import {List} from '@astryxdesign/core/List';`

## Anatomy

| Element          | Required | Description                                            |
| ---------------- | -------- | ------------------------------------------------------ |
| List title       | Yes      | Heading that labels the list.                          |
| Description      | No       | Supplementary text below the title.                    |
| List items       | Yes      | Individual entries, which may include icons or images. |
| Item description | No       | Additional detail for an individual list item.         |

## Best Practices

- **Do:** Provide a header to label the list and give context to screen readers.
- **Do:** Use start and end content slots to add icons, avatars, or badges to each item.
- **Don't:** Place interactive elements inside an interactive list item; it creates nested click targets and confusing focus behavior.
- **Don't:** Use a list for a single item or for laying out unrelated content; lists imply a meaningful collection.
- **Don't:** Mix clickable and non-clickable items in the same list without clear visual distinction.

## Props

| Prop          | Type                                        | Default      | Description                                                                                                                                         |
| ------------- | ------------------------------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `children`    | `ReactNode`                                 | —            | List items (ListItem components).                                                                                                                   |
| `density`     | `'compact' \| 'balanced' \| 'spacious'`     | `'balanced'` | Spacing density for items.                                                                                                                          |
| `hasDividers` | `boolean`                                   | `false`      | Show dividers between items.                                                                                                                        |
| `header`      | `ReactNode`                                 | —            | Header content, associated with the list via aria-labelledby.                                                                                       |
| `listStyle`   | `'none' \| 'disc' \| 'decimal' \| 'circle'` | `'none'`     | List marker style. 'decimal' renders an <ol> element instead of <ul>.                                                                               |
| `start`       | `number`                                    | `1`          | Starting number for ordered lists (listStyle='decimal'). Sets the CSS counter to begin at this value.                                               |
| `xstyle`      | `StyleXStyles`                              | —            | StyleX styles for layout customization (margins, positioning, sizing). Must be a stylex.create() value: not an inline style object like style={{}}. |

## Components

### ListItem

See `npx astryx component ListItem` for props and usage.

## Theming

| Component class    | Preferred data attributes         | Props              | States |
| ------------------ | --------------------------------- | ------------------ | ------ |
| `astryx-list`      | `data-density`, `data-list-style` | density, listStyle | —      |
| `astryx-list-item` | —                                 | —                  | —      |

Override in defineTheme:

```ts
components: {
  'list': {
    base: { /* CSS properties */ },
    'density:value': { /* variant-specific */ },
  },
  'list-item': {
    base: { /* CSS properties */ },
  },
}
```

Related block templates:

BannerCollapsibleContent
Combine an action button, dismiss control, and expandable detail area in one banner. Use for complex notifications like config changes or deployment summaries.
ChatComposerDrawerFeedback
Chat composer drawer with a feedback prompt and selectable lettered options. Use for user confirmation workflows that require explicit action before proceeding.
KbdMenuShortcuts
Menu-style list pairing action labels with their keyboard shortcuts
LayoutDualPanelLayout
A file browser style layout with start panel for folders, main content for files, and end panel for details.
LayoutShowcase
LayoutSidebarLayout
A settings page layout with a navigation sidebar panel, content area, header, and footer.
LayoutPanelNavigation
A fixed-width side panel holding a navigation list next to the main content. Use LayoutPanel in the start or end slot of Layout for sidebars.
ListBasicList
Simple list with labels and descriptions for settings-style layouts.
ListBulletedFeatures
Bulleted list of feature highlights using disc markers.
ListMessageList
Chat-style message list with avatars, preview text, and unread badges.
ListOrderedSteps
Numbered step-by-step instructions using decimal list markers.
ListShowcase
ListItemBasicItem
Basic list items with labels and descriptions. Use this structure for settings, navigation summaries, and other simple collections.
ListItemShowcase
List items with icons, descriptions, and end content slots demonstrating the full ListItem API.
ListItemWithMedia
List items with leading avatars and icons. Use startContent for compact visual identifiers that help users scan the collection.
ListItemWithMetadata
List items with end-aligned metadata. Use endContent for badges, counts, timestamps, and compact status details.
SideNavWithHeaderMenu
Side navigation with an account switcher dropdown in the header for multi-account apps.

---

# ListItem

List item w/ label, description, start/end content slots, interactive patterns.

**Import:** `import {ListItem} from '@astryxdesign/core/List';`

## Props

| Prop           | Type                      | Default | Description                                                                                     |
| -------------- | ------------------------- | ------- | ----------------------------------------------------------------------------------------------- |
| `label`        | `string`                  | —       | Primary text. **(required)**                                                                    |
| `description`  | `ReactNode`               | —       | Secondary text below label.                                                                     |
| `startContent` | `ReactNode`               | —       | Content before label area (e.g. icon, avatar).                                                  |
| `endContent`   | `ReactNode`               | —       | Content after label area (e.g. badge, chevron).                                                 |
| `onClick`      | `(e: MouseEvent) => void` | —       | Click handler; enables invisible button pattern.                                                |
| `href`         | `string`                  | —       | Link URL; enables invisible anchor pattern.                                                     |
| `target`       | `string`                  | —       | Link target attribute, only when href provided. target="\_blank" auto-adds noopener noreferrer. |
| `rel`          | `string`                  | —       | Link relationship tokens. noopener noreferrer are merged for target="\_blank".                  |
| `isDisabled`   | `boolean`                 | `false` | Disabled state; sets aria-disabled.                                                             |
| `isSelected`   | `boolean`                 | `false` | Selected state; sets aria-selected.                                                             |

Related block templates:

LayoutDualPanelLayout
A file browser style layout with start panel for folders, main content for files, and end panel for details.
LayoutSidebarLayout
A settings page layout with a navigation sidebar panel, content area, header, and footer.
LayoutPanelNavigation
A fixed-width side panel holding a navigation list next to the main content. Use LayoutPanel in the start or end slot of Layout for sidebars.
ListItemBasicItem
Basic list items with labels and descriptions. Use this structure for settings, navigation summaries, and other simple collections.
ListItemShowcase
List items with icons, descriptions, and end content slots demonstrating the full ListItem API.
ListItemWithMedia
List items with leading avatars and icons. Use startContent for compact visual identifiers that help users scan the collection.
ListItemWithMetadata
List items with end-aligned metadata. Use endContent for badges, counts, timestamps, and compact status details.

---

# Item

Flexible item primitive unifying the "start content + label + description + end content" pattern. Use for structured rows in menus, lists, contacts, notifications, file browsers.

**Import:** `import {Item} from '@astryxdesign/core/Item';`

## Anatomy

| Element       | Required | Description                                                 |
| ------------- | -------- | ----------------------------------------------------------- |
| Marker        | No       | Optional list bullet/counter rendered before start content. |
| Start content | No       | Leading visual: avatar, icon, image, or checkbox.           |
| Label         | Yes      | Primary text identifying the item.                          |
| Description   | No       | Secondary supporting text below the label.                  |
| End content   | No       | End-aligned content: badges, timestamps, or action buttons. |

## Best Practices

- **Do:** Named slots (startContent, label, description, endContent) for the 80% case.
- **Do:** density="compact" for menus/dense lists, "balanced" for standard rows, "spacious" for roomier layouts.
- **Do:** labelLines/descriptionLines for truncation control.
- **Do:** align="start" when start/end content is taller than one text line.
- **Don't:** Don't nest interactive elements inside interactive Item.
- **Don't:** Don't use for view navigation; use nav components.
- **Don't:** Don't add inbox-specific behavior; compose a wrapper.

## Components

### Item

universal item primitive w/ startContent+label+description+endContent layout

| Prop               | Type                                    | Default      | Description                                                                     |
| ------------------ | --------------------------------------- | ------------ | ------------------------------------------------------------------------------- |
| `label`            | `ReactNode`                             | —            | Primary text. String auto-truncates; ReactNode for rich content. **(required)** |
| `marker`           | `ReactNode`                             | —            | List bullet/counter before startContent as direct flex child.                   |
| `startContent`     | `ReactNode`                             | —            | Content before label/description: avatar, icon, checkbox, ReactNode.            |
| `description`      | `ReactNode`                             | —            | Secondary text below label.                                                     |
| `endContent`       | `ReactNode`                             | —            | Content after label/description: badges, timestamps, actions.                   |
| `as`               | `'div' \| 'li' \| 'span'`               | `'div'`      | Root HTML element.                                                              |
| `align`            | `'center' \| 'start'`                   | `'center'`   | Vertical alignment of start/end content slots.                                  |
| `density`          | `'compact' \| 'balanced' \| 'spacious'` | `'balanced'` | Spacing: "compact" (4px), "balanced" (8px), or "spacious" (12px).               |
| `labelLines`       | `number`                                | —            | Max label lines before truncation.                                              |
| `descriptionLines` | `number`                                | —            | Max description lines before truncation.                                        |
| `onClick`          | `(event: MouseEvent) => void`           | —            | Click handler; enables button semantics.                                        |
| `href`             | `string`                                | —            | Link URL; enables anchor semantics.                                             |
| `target`           | `'_blank' \| '_self'`                   | —            | Link target, only with href. target="\_blank" auto-adds noopener noreferrer.    |
| `rel`              | `string`                                | —            | Link relationship tokens. noopener noreferrer are merged for target="\_blank".  |
| `isHighlighted`    | `boolean`                               | `false`      | Highlighted state.                                                              |
| `isSelected`       | `boolean`                               | `false`      | Selected state.                                                                 |
| `isDisabled`       | `boolean`                               | `false`      | Disabled state.                                                                 |
| `ref`              | `React.Ref<HTMLDivElement>`             | —            | Ref forwarded to the root element.                                              |
| `xstyle`           | `StyleXStyles`                          | —            | StyleX layout styles; must be stylex.create() value.                            |
| `data-testid`      | `string`                                | —            | Test selector.                                                                  |

## Theming

| Component class | Preferred data attributes    | Props          | States |
| --------------- | ---------------------------- | -------------- | ------ |
| `astryx-item`   | `data-density`, `data-align` | density, align | —      |

Override in defineTheme:

```ts
components: {
  'item': {
    base: { /* CSS properties */ },
    'density:value': { /* variant-specific */ },
  },
}
```

Related block templates:

ItemBasicItem
A basic item with a label, supporting description, and end-aligned timestamp. Use this for simple rows that need consistent text alignment and spacing.
ItemShowcase
ItemWithMedia
Items with leading avatars and icons in the startContent slot. Keep start content small so the row stays compact and easy to scan.
ItemWithMetadata
Items with end-aligned metadata and badges. Use the endContent slot for counts, status, timestamps, and other secondary row information.

---

# Divider

A visual separator that divides content into distinct sections. Use to create clear boundaries between groups of related content, or to demarcate interactive regions within a layout.

**Import:** `import {Divider} from '@astryxdesign/core/Divider';`

## Best Practices

- **Do:** Use subtle dividers between related content sections and strong dividers for high-contrast boundaries.
- **Do:** Add a label to the divider when sections need a visible category heading.
- **Don't:** Overuse dividers; rely on spacing and layout to separate content when possible.

## Props

| Prop          | Type                         | Default        | Description                                             |
| ------------- | ---------------------------- | -------------- | ------------------------------------------------------- |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | divider orientation                                     |
| `label`       | `ReactNode`                  | —              | optional centered label on divider                      |
| `variant`     | `'subtle' \| 'strong'`       | `'subtle'`     | visual weight of divider line                           |
| `isFullBleed` | `boolean`                    | `false`        | extend to container edges w/ negative margins           |
| `xstyle`      | `StyleXStyles`               | —              | StyleX styles for layout; must be stylex.create() value |

## Theming

| Component class  | Preferred data attributes          | Props          | States |
| ---------------- | ---------------------------------- | -------------- | ------ |
| `astryx-divider` | `data-orientation`, `data-variant` | subtle, strong | —      |

Override in defineTheme:

```ts
components: {
  'divider': {
    base: { /* CSS properties */ },
    'orientation:value': { /* variant-specific */ },
  },
}
```

Related block templates:

CheckboxInputIndeterminateState
A "select all" checkbox that controls a group of options. When only some options are checked, it shows a dash instead of a checkmark. Clicking it checks or unchecks everything.
CheckboxListSelectAllPattern
A "select all" toggle at the top of a checkbox list that switches to an indeterminate dash when only some items are checked, useful for bulk actions like exporting documents or assigning permissions where users often want everything at once.
CollapsibleWithoutCard
Collapsible sections separated by dividers instead of cards. Use for inline disclosure in detail panels or sidebar content where cards would add too much weight.
DividerFullBleed
Divider that extends past container padding to span the full width. Use inside cards or panels when you want a clean edge-to-edge separation, like between an order summary and total.
DividerShowcase
Horizontal dividers in subtle and strong variants, plus a labeled divider. A quick visual reference for separator styles.
DividerVariants
Subtle, labeled, and strong dividers in a single card. Use subtle between related sections, labeled for alternatives like "or", and strong for high-contrast boundaries.
DividerVertical
Vertical dividers separating side-by-side metrics. Use between stat cards, toolbar groups, or any horizontal layout where you need a visual boundary between sections.
PopoverFilterPanel
Popover with checkbox filters and apply/reset actions.
PopoverKeyboardShortcuts
Popover displaying a list of keyboard shortcuts with key and description pairs.
PopoverSettingsPanel
Popover with toggle switches for managing user preferences like notifications, dark mode, and sounds.
PopoverShowcase

---

# Switch

A toggle control for on/off states that take effect immediately. Supports labels, descriptions, loading states, and validation. Use it for settings or preferences that apply instantly. For changes requiring a form submission, use a checkbox instead.

**Import:** `import {Switch} from '@astryxdesign/core/Switch';`

## Best Practices

- **Do:** Use for settings that apply immediately; the toggle should take effect without a separate save action.
- **Do:** Pair with a clear, concise label that describes the setting being controlled.
- **Don't:** Use for options that require a form submission to take effect; use a checkbox instead.
- **Don't:** Use a switch for multi-state values; it's strictly on/off.
- **Don't:** Wrap a disabled switch in Tooltip to explain why it is disabled; disabled controls swallow the hover events the wrapper needs. Use the disabledMessage prop instead.

## Props

| Prop              | Type                                                                            | Default | Description                                                                                                                                                                                                                                                                                               |
| ----------------- | ------------------------------------------------------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ref`             | `React.Ref<HTMLInputElement>`                                                   | —       | ref forwarded to underlying <input>                                                                                                                                                                                                                                                                       |
| `label`           | `string`                                                                        | —       | Label text (always rendered for a11y). **(required)**                                                                                                                                                                                                                                                     |
| `value`           | `boolean`                                                                       | —       | Whether switch is on or off. **(required)**                                                                                                                                                                                                                                                               |
| `onChange`        | `(checked: boolean, e: ChangeEvent<HTMLInputElement>) => void`                  | —       | Fired when switch state changes.                                                                                                                                                                                                                                                                          |
| `changeAction`    | `(checked: boolean, e: ChangeEvent<HTMLInputElement>) => void \| Promise<void>` | —       | Async action after onChange; triggers optimistic UI + loading spinner until resolved.                                                                                                                                                                                                                     |
| `isLoading`       | `boolean`                                                                       | `false` | Loading state; shows spinner in thumb.                                                                                                                                                                                                                                                                    |
| `isLabelHidden`   | `boolean`                                                                       | `false` | Visually hides label; still accessible to screen readers.                                                                                                                                                                                                                                                 |
| `description`     | `string`                                                                        | —       | Description text below label.                                                                                                                                                                                                                                                                             |
| `isDisabled`      | `boolean`                                                                       | `false` | Whether switch is disabled.                                                                                                                                                                                                                                                                               |
| `htmlName`        | `string`                                                                        | —       | HTML name attr for the checkbox; submits "on" when on.                                                                                                                                                                                                                                                    |
| `disabledMessage` | `string`                                                                        | —       | Explains why the switch is disabled. With isDisabled, shows a tooltip on hover/keyboard focus and keeps the switch focusable via aria-disabled (toggling stays blocked). Use this instead of wrapping a disabled Switch in Tooltip. Disabled controls swallow the hover events an external Tooltip needs. |
| `isOptional`      | `boolean`                                                                       | `false` | Whether field is optional; mutually exclusive w/ isRequired.                                                                                                                                                                                                                                              |
| `isRequired`      | `boolean`                                                                       | `false` | Whether switch is required; mutually exclusive w/ isOptional.                                                                                                                                                                                                                                             |
| `status`          | `{type: 'warning' \| 'error' \| 'success', message?: string}`                   | —       | Status indicator w/ type + message; colored message box, sets aria-invalid on error.                                                                                                                                                                                                                      |
| `onFocus`         | `(e: FocusEvent<HTMLInputElement>) => void`                                     | —       | Fired when switch receives focus.                                                                                                                                                                                                                                                                         |
| `onBlur`          | `(e: FocusEvent<HTMLInputElement>) => void`                                     | —       | Fired when switch loses focus.                                                                                                                                                                                                                                                                            |
| `labelIcon`       | `IconType`                                                                      | —       | Icon before label text.                                                                                                                                                                                                                                                                                   |
| `labelTooltip`    | `string`                                                                        | —       | Tooltip text in info icon at label end.                                                                                                                                                                                                                                                                   |
| `labelPosition`   | `'start' \| 'end'`                                                              | `'end'` | Which side label appears; "start" places before switch.                                                                                                                                                                                                                                                   |
| `labelSpacing`    | `'hug' \| 'spread'`                                                             | `'hug'` | Spacing behavior; "hug" places next to each other, "spread" pushes to opposite ends (full width). "default" is deprecated alias for "hug".                                                                                                                                                                |

## Theming

| Component class       | Preferred data attributes                   | Props                       | States            |
| --------------------- | ------------------------------------------- | --------------------------- | ----------------- |
| `astryx-switch`       | `data-checked`, `data-disabled`             | —                           | checked, disabled |
| `astryx-switch-thumb` | `data-checked`                              | —                           | checked           |
| `astryx-switch-field` | `data-label-position`, `data-label-spacing` | labelPosition, labelSpacing | —                 |

Override in defineTheme:

```ts
components: {
  'switch': {
    base: { /* CSS properties */ },
    'checked': { /* state-specific */ },
  },
  'switch-thumb': {
    base: { /* CSS properties */ },
    'checked': { /* state-specific */ },
  },
}
```

Related block templates:

PopoverSettingsPanel
Popover with toggle switches for managing user preferences like notifications, dark mode, and sounds.
SwitchDisabled
Disabled switch with label and description for gated features.
SwitchSettingsPanel
Settings panel with spread-spaced switches in a card.
SwitchShowcase
A toggle switch for enabling notifications.
SwitchWithDescription
Toggle with a label and supporting description text.
SwitchWithStatus
Switches with error, warning, and success validation states.

---

# CheckboxInput

CheckboxInput toggles a single on/off value. Use for settings, terms acceptance, opt-in choices. Use CheckboxList for groups.

**Import:** `import {CheckboxInput} from '@astryxdesign/core/CheckboxInput';`

## Anatomy

| Element        | Required | Description                                                                   |
| -------------- | -------- | ----------------------------------------------------------------------------- |
| Checkbox       | Yes      | The check box itself: unchecked, checked, or indeterminate.                   |
| Label          | Yes      | Text describing what the checkbox controls. Always present for accessibility. |
| Description    | No       | Helper text below the label with additional context.                          |
| Status message | No       | An error, warning, or success message below the checkbox.                     |

## Best Practices

- **Do:** Always provide a visible label so user knows what they're toggling. Use isLabelHidden only when surrounding context makes it obvious.
- **Do:** Add a description for choices that need extra context, e.g. what "Share usage data" actually shares.
- **Do:** Use the indeterminate state for "select all" checkboxes when only some items in a group are selected.
- **Don't:** Use a checkbox for mutually exclusive choices; use RadioList when only one option can be selected.
- **Don't:** Use a checkbox for actions that take effect immediately; use a toggle switch or button instead.
- **Don't:** Wrap a disabled checkbox in Tooltip to explain why it is disabled; disabled controls swallow the hover events the wrapper needs. Use the disabledMessage prop instead.

## Props

| Prop              | Type                                                                            | Default | Description                                                                                                                                                                                                                                                                                                          |
| ----------------- | ------------------------------------------------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ref`             | `React.Ref<HTMLInputElement>`                                                   | —       | ref forwarded to underlying <input>                                                                                                                                                                                                                                                                                  |
| `label`           | `string`                                                                        | —       | label text; always rendered for a11y **(required)**                                                                                                                                                                                                                                                                  |
| `isLabelHidden`   | `boolean`                                                                       | `false` | visually hide label (still accessible to screen readers)                                                                                                                                                                                                                                                             |
| `description`     | `string`                                                                        | —       | text below label                                                                                                                                                                                                                                                                                                     |
| `value`           | `boolean \| 'indeterminate'`                                                    | —       | checked, unchecked, or indeterminate **(required)**                                                                                                                                                                                                                                                                  |
| `onChange`        | `(checked: boolean, e: ChangeEvent<HTMLInputElement>) => void`                  | —       | callback on state change                                                                                                                                                                                                                                                                                             |
| `changeAction`    | `(checked: boolean, e: ChangeEvent<HTMLInputElement>) => void \| Promise<void>` | —       | async action; fires after onChange, shows spinner while pending                                                                                                                                                                                                                                                      |
| `isLoading`       | `boolean`                                                                       | `false` | shows spinner + prevents interaction                                                                                                                                                                                                                                                                                 |
| `isDisabled`      | `boolean`                                                                       | `false` | disable checkbox                                                                                                                                                                                                                                                                                                     |
| `htmlName`        | `string`                                                                        | —       | HTML name attr for the checkbox; submits "on" when checked.                                                                                                                                                                                                                                                          |
| `disabledMessage` | `string`                                                                        | —       | Explains why the checkbox is disabled. With isDisabled, shows a tooltip on hover/keyboard focus and keeps the checkbox focusable via aria-disabled (toggling stays blocked). Use this instead of wrapping a disabled CheckboxInput in Tooltip. Disabled controls swallow the hover events an external Tooltip needs. |
| `isReadOnly`      | `boolean`                                                                       | `false` | Whether the checkbox is read-only. Displays the current state at full opacity but prevents interaction. Unlike `isDisabled`, read-only checkboxes are not visually dimmed.                                                                                                                                           |
| `isOptional`      | `boolean`                                                                       | `false` | mark field as optional (mutually exclusive w/ isRequired)                                                                                                                                                                                                                                                            |
| `isRequired`      | `boolean`                                                                       | `false` | mark field as required (mutually exclusive w/ isOptional)                                                                                                                                                                                                                                                            |
| `size`            | `'sm' \| 'md'`                                                                  | `'md'`  | sm (compact) or md (default)                                                                                                                                                                                                                                                                                         |
| `onFocus`         | `(e: FocusEvent<HTMLInputElement>) => void`                                     | —       | callback on focus                                                                                                                                                                                                                                                                                                    |
| `onBlur`          | `(e: FocusEvent<HTMLInputElement>) => void`                                     | —       | callback on blur                                                                                                                                                                                                                                                                                                     |
| `labelIcon`       | `IconType`                                                                      | —       | icon before label text                                                                                                                                                                                                                                                                                               |
| `status`          | `{ type: 'error' \| 'warning' \| 'success', message: string }`                  | —       | error/warning/success with message; sets aria-invalid on error                                                                                                                                                                                                                                                       |

## Theming

| Component class         | Preferred data attributes                    | Props | States            |
| ----------------------- | -------------------------------------------- | ----- | ----------------- |
| `astryx-checkbox-input` | `data-size`                                  | size  | —                 |
| `astryx-checkbox`       | `data-size`, `data-checked`, `data-disabled` | size  | checked, disabled |

Override in defineTheme:

```ts
components: {
  'checkbox-input': {
    base: { /* CSS properties */ },
    'size:value': { /* variant-specific */ },
  },
  'checkbox': {
    base: { /* CSS properties */ },
    'checked': { /* state-specific */ },
  },
}
```

Related block templates:

CheckboxInputBasic
Checkboxes with labels and descriptions in checked, unchecked, and disabled states. Each checkbox controls a single on/off setting. Add a description to explain what the setting does.
CheckboxInputIndeterminateState
A "select all" checkbox that controls a group of options. When only some options are checked, it shows a dash instead of a checkmark. Clicking it checks or unchecks everything.
CheckboxInputShowcase
Interactive checkboxes showing checked, unchecked, and indeterminate states with descriptions.
CheckboxInputStatusVariations
Checkboxes with error, warning, and success validation messages. Use the status prop to show feedback after form validation: errors block submission, warnings inform, and success confirms.
PopoverFilterPanel
Popover with checkbox filters and apply/reset actions.

---

# DropdownMenu

A dropdown menu that displays a list of actionable items in a popup triggered by a button. Use to present action options as a next step in a process, or to offer contextual actions without cluttering the interface.

**Import:** `import {DropdownMenu} from '@astryxdesign/core/DropdownMenu';`

## Best Practices

- **Do:** Keep menu items concise and action-oriented so users can scan options quickly.
- **Do:** Use sections and dividers to group related actions when the menu has many items.
- **Don't:** Use a DropdownMenu for navigation; use a navigation component instead.
- **Don't:** Place more than 10–12 items in a single menu without grouping them into sections.

## Props

| Prop           | Type                                        | Default             | Description                                                                                                                                                                                                            |
| -------------- | ------------------------------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `button`       | `DropdownMenuButtonProps`                   | `{ label: 'Menu' }` | Props for the trigger button (Button props except onClick).                                                                                                                                                            |
| `items`        | `DropdownMenuOption[]`                      | —                   | Array of menu entries. Each entry is one of: an action item `{label, onClick?, icon?, isDisabled?}`, a divider `{type: "divider"}`, or a section `{type: "section", title?, items: [...action items]}`. **(required)** |
| `isMenuOpen`   | `boolean`                                   | —                   | Controlled open state for the menu.                                                                                                                                                                                    |
| `onOpenChange` | `(isOpen: boolean) => void`                 | —                   | Callback fired when the open state changes.                                                                                                                                                                            |
| `menuWidth`    | `number \| string`                          | —                   | Custom menu width; defaults to matching the trigger button width.                                                                                                                                                      |
| `onClick`      | `() => void`                                | —                   | Callback fired when the trigger button is clicked.                                                                                                                                                                     |
| `hasChevron`   | `boolean`                                   | `true`              | Whether to show a chevron icon on the trigger button. Set to false for icon-only triggers.                                                                                                                             |
| `children`     | `(item: DropdownMenuItemData) => ReactNode` | —                   | Custom render function for each item in the list.                                                                                                                                                                      |

## Components

### DropdownMenuItem

See `npx astryx component DropdownMenuItem` for props and usage.

## Theming

| Component class                 | Preferred data attributes                    | Props | States            |
| ------------------------------- | -------------------------------------------- | ----- | ----------------- |
| `astryx-dropdown-menu`          | —                                            | —     | —                 |
| `astryx-dropdown-menu-item`     | `data-size`                                  | size  | —                 |
| `astryx-dropdown-menu-checkbox` | `data-size`, `data-checked`, `data-disabled` | size  | checked, disabled |
| `astryx-dropdown-menu-radio`    | `data-size`, `data-checked`, `data-disabled` | size  | checked, disabled |

Override in defineTheme:

```ts
components: {
  'dropdown-menu': {
    base: { /* CSS properties */ },
  },
  'dropdown-menu-item': {
    base: { /* CSS properties */ },
  },
}
```

Some properties are set via standard CSS in component overrides:

```ts
components: {
  dropdown-menu: {
    base: {
      borderRadius: '...',
      padding: '...',
    },
  },
}
```

Related block templates:

ChatComposerFooterActions
Chat composer with dropdown menus for a model selector and settings in the footer, and a mic button in the send actions slot.
ChatComposerFullFeatured
Chat composer with all slots populated: collapsible attachment drawer, header actions, context progress bar, footer dropdown menus, and mic button. Shows the maximum composer configuration.
DropdownMenuActions
Action menu with dividers separating safe and destructive operations. Use for row-level actions on items like documents, projects, or records.
DropdownMenuNoChevron
Overflow menu triggered by an icon-only button with no chevron or label text. Use for row-level actions in tables, cards, or lists where a text button would take too much space.
DropdownMenuShowcase
A button that opens a dropdown menu with action items. The menu starts open for preview.
DropdownMenuWithDisabledItems
Menu with selectively disabled items based on permissions. Use when some actions require higher privileges, like admin-only operations.
DropdownMenuWithSections
Menu items organized into titled sections for easy scanning. Use when you have 6+ actions that fall into distinct categories, like Create vs Manage.
DropdownMenuItemBasic
Dropdown menu items with labels and secondary descriptions. Use DropdownMenuItem to render custom menu entries with consistent styling.
DropdownMenuItemShowcase
Dropdown menu with custom-rendered items using DropdownMenuItem for icons and descriptions.
OverflowListOverflowDropdownActions
Action toolbar that collapses overflow buttons into a dropdown menu

---

# Popover

A click-triggered overlay anchored to a button or trigger element. Use it for secondary actions, inline confirmations, or supplementary information that does not warrant a full dialog. For hover previews use HoverCard, for brief helper text use Tooltip.

**Import:** `import {Popover} from '@astryxdesign/core/Popover';`

## Anatomy

| Element         | Required | Description                                               |
| --------------- | -------- | --------------------------------------------------------- |
| Header          | Yes      | Contains the title, optional subheader, and close button. |
| Body            | Yes      | Main content area of the popover.                         |
| Trigger Element | Yes      | The button or link that toggles the popover open.         |

## Best Practices

- **Do:** Keep popover content focused on a single task or piece of information.
- **Do:** Provide a clear way to close: either by clicking outside or with an explicit close button.
- **Don't:** Nest popovers inside other popovers; it creates confusing focus and navigation.
- **Don't:** Use a popover for content that requires heavy user input; use a Dialog instead.
- **Don't:** Put too much content in a popover; if it needs scrolling, use a Dialog instead.

## Components

### Popover

Click-triggered popover for interactive content anchored to trigger element.

| Prop               | Type                                     | Default           | Description                                                                                                                                         |
| ------------------ | ---------------------------------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `children`         | `ReactNode`                              | —                 | Trigger element. Must contain <button> or [role="button"] element.                                                                                  |
| `anchorRef`        | `React.RefObject<HTMLElement>`           | —                 | External ref for popover anchor in sibling mode.                                                                                                    |
| `content`          | `ReactNode`                              | —                 | Content displayed inside popover. **(required)**                                                                                                    |
| `placement`        | `'above' \| 'below' \| 'start' \| 'end'` | `'below'`         | Position relative to trigger. Logical: start/end resolve against the popover's inherited direction (RTL mirrors).                                   |
| `alignment`        | `'start' \| 'center' \| 'end'`           | `'start'`         | Alignment along placement axis. Logical: start/end follow the popover's inherited direction (RTL mirrors).                                          |
| `isOpen`           | `boolean`                                | —                 | Whether popover shown in controlled mode.                                                                                                           |
| `onOpenChange`     | `(isOpen: boolean) => void`              | —                 | Callback fired when popover visibility changes.                                                                                                     |
| `isEnabled`        | `boolean`                                | `true`            | When false, trigger interactions ignored.                                                                                                           |
| `width`            | `number \| string`                       | `'auto'`          | Popover container width.                                                                                                                            |
| `label`            | `string`                                 | —                 | Accessible label for popover dialog.                                                                                                                |
| `hasCloseButton`   | `boolean`                                | `true`            | Whether to include hidden close button for accessibility.                                                                                           |
| `closeButtonLabel` | `string`                                 | `'Close popover'` | Label for hidden close button.                                                                                                                      |
| `hasAutoFocus`     | `boolean`                                | `true`            | Auto-focus first element on open; false for showcases.                                                                                              |
| `hasLightDismiss`  | `boolean`                                | `true`            | Outside click dismisses; false for explicit-dismiss surfaces (coachmarks).                                                                          |
| `hasEscapeDismiss` | `boolean`                                | `true`            | Escape dismisses; full effect only with hasLightDismiss=false.                                                                                      |
| `xstyle`           | `StyleXStyles`                           | —                 | StyleX styles for layout customization (margins, positioning, sizing). Must be a stylex.create() value, not an inline style object like style={{}}. |

## Theming

| Component class  | Preferred data attributes | Props | States |
| ---------------- | ------------------------- | ----- | ------ |
| `astryx-popover` | —                         | —     | —      |

Override in defineTheme:

```ts
components: {
  'popover': {
    base: { /* CSS properties */ },
  },
}
```

Some properties are set via standard CSS in component overrides:

```ts
components: {
  popover: {
    base: {
      borderRadius: '...',
    },
  },
}
```

Related block templates:

PopoverConfirmAction
Inline confirmation popover for destructive actions with delete and cancel buttons.
PopoverFilterPanel
Popover with checkbox filters and apply/reset actions.
PopoverHookUsage
Custom quick-actions popover using usePopover for trigger refs, ARIA attributes, and focus trapping.
PopoverKeyboardShortcuts
Popover displaying a list of keyboard shortcuts with key and description pairs.
PopoverSettingsPanel
Popover with toggle switches for managing user preferences like notifications, dark mode, and sounds.
PopoverShowcase

---

# CommandPalette

CommandPalette is a searchable dialog for quick access to commands, navigation, and actions. Use it as a keyboard-driven launcher powered by SearchSource for filtering and selection.

**Import:** `import {CommandPalette} from '@astryxdesign/core/CommandPalette';`

## Best Practices

- **Do:** Provide a searchSource with bootstrap results so users see useful options before typing.
- **Do:** Use auxiliaryData.group on items to automatically organize results into labeled sections.
- **Don't:** Use CommandPalette for simple dropdowns or menus; use Menu or Selector for inline selections.
- **Don't:** Add too many groups or items; curate results to keep the palette fast and scannable.

## Props

| Prop                 | Type                                          | Default                    | Description                                                                                                                                                                                     |
| -------------------- | --------------------------------------------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `isOpen`             | `boolean`                                     | —                          | Whether the command palette dialog is visible. **(required)**                                                                                                                                   |
| `onOpenChange`       | `(isOpen: boolean) => void`                   | —                          | Called when the palette visibility changes. **(required)**                                                                                                                                      |
| `searchSource`       | `SearchSource<T>`                             | —                          | Search source providing items via search(query) and bootstrap(). Use createStaticSource for static lists. **(required)**                                                                        |
| `input`              | `ReactNode`                                   | `<CommandPaletteInput />`  | Input slot. Defaults to CommandPaletteInput with standard behavior.                                                                                                                             |
| `footer`             | `ReactNode`                                   | `<CommandPaletteFooter />` | Footer slot. Defaults to CommandPaletteFooter showing keyboard hints.                                                                                                                           |
| `renderItem`         | `(item: T, isSelected: boolean) => ReactNode` | —                          | Per-item render function. Auto-grouping by auxiliaryData.group is preserved. When omitted, renders label text.                                                                                  |
| `emptySearchText`    | `ReactNode`                                   | `'No results'`             | Content shown when a search query returns no results.                                                                                                                                           |
| `emptyBootstrapText` | `ReactNode`                                   | `'Type to search'`         | Content shown when there is no search query and bootstrap() returns nothing.                                                                                                                    |
| `value`              | `string`                                      | —                          | Controlled selected value for picker mode.                                                                                                                                                      |
| `onValueChange`      | `(value: string) => void`                     | —                          | Called when the selected value changes in picker mode.                                                                                                                                          |
| `label`              | `string`                                      | `'Command palette'`        | Accessible label for the command palette dialog.                                                                                                                                                |
| `width`              | `number \| string`                            | `640`                      | Width of the dialog.                                                                                                                                                                            |
| `maxHeight`          | `number \| string`                            | `480`                      | Maximum height of the dialog.                                                                                                                                                                   |
| `isInline`           | `boolean`                                     | `false`                    | Renders command palette content inline without modal behavior. Automatically disables input auto-focus and initial highlighted-item auto-scroll. For documentation previews and showcases only. |

## Components

### CommandPaletteInput

See `npx astryx component CommandPaletteInput` for props and usage.

### CommandPaletteList

See `npx astryx component CommandPaletteList` for props and usage.

### CommandPaletteItem

See `npx astryx component CommandPaletteItem` for props and usage.

### CommandPaletteGroup

See `npx astryx component CommandPaletteGroup` for props and usage.

### CommandPaletteFooter

See `npx astryx component CommandPaletteFooter` for props and usage.

### CommandPaletteEmpty

See `npx astryx component CommandPaletteEmpty` for props and usage.

## Theming

| Component class                 | Preferred data attributes | Props | States |
| ------------------------------- | ------------------------- | ----- | ------ |
| `astryx-command-palette-empty`  | —                         | —     | —      |
| `astryx-command-palette-footer` | —                         | —     | —      |
| `astryx-command-palette-group`  | —                         | —     | —      |
| `astryx-command-palette-input`  | —                         | —     | —      |
| `astryx-command-palette-item`   | —                         | —     | —      |
| `astryx-command-palette-list`   | —                         | —     | —      |

Override in defineTheme:

```ts
components: {
  'command-palette-empty': {
    base: { /* CSS properties */ },
  },
  'command-palette-footer': {
    base: { /* CSS properties */ },
  },
}
```

Related block templates:

CommandPaletteAsyncSearch
Server-side search with loading spinner and custom empty states.
CommandPaletteAutoGrouped
Command palette with items grouped via auxiliaryData.group.
CommandPaletteCustomFooter
Command palette with a custom footer tip message.
CommandPalettePickerMode
Single-value picker with persistent selection and check indicator.
CommandPaletteRichItems
Custom item rendering with icons, keyboard shortcuts, and keyword search.
CommandPaletteShowcase
Basic command palette with static items and keyboard navigation.
CommandPaletteEmptyBasic
A command palette with no results, showing a custom empty message via emptyBootstrapText. Use to explain why the palette is empty and what the user can do next.
CommandPaletteEmptyShowcase
Command palette empty state shown when no commands are available.
CommandPaletteFooterBasic
A command palette footer with no children, rendering the built-in keyboard navigation hints. Use CommandPaletteFooter without content to get the default arrow-key, Enter, and Esc hints below the results list.
CommandPaletteFooterShowcase
Command palette footer with custom tip content.
CommandPaletteGroupShowcase
Command palette groups in both data-driven (auxiliaryData.group) and composed (CommandPaletteGroup + CommandPaletteItem) forms.
CommandPaletteInputBasic
Custom placeholder and a keyboard shortcut badge in the trailing slot via endContent.
CommandPaletteInputShowcase
Command palette search input with a custom placeholder and a keyboard shortcut hint in the endContent slot.
CommandPaletteItemShowcase
Command palette items with custom content via renderItem and as composed CommandPaletteItem with icons, highlighted, selected, and disabled states.

---

# Section

Section creates page regions. Use for settings groups, form sections, sidebar areas. If you want to visually separate a part of a page, use Section, not Card. Cards are for discrete items (one profile, one notification).

**Import:** `import {Section} from '@astryxdesign/core/Section';`

## Best Practices

- **Do:** Use Section for page-level grouping: settings panels, form groups, sidebar regions. Page sections, not discrete items.
- **Do:** Start w/ default variant. Use muted only to call attention to a specific region.
- **Do:** Add dividers between same-background sections that need separation.
- **Do:** Combine w/ heading + Stack for typical page section pattern.
- **Don't:** Use Card when you mean Section. Cards = discrete items (one notification, one profile). Sections = page regions.

## Props

| Prop           | Type                                                       | Default     | Description                                                               |
| -------------- | ---------------------------------------------------------- | ----------- | ------------------------------------------------------------------------- |
| `variant`      | `'section' \| 'transparent' \| 'muted'`                    | `'section'` | Background variant applied to section container.                          |
| `width`        | `SizeValue`                                                | —           | Section width; number interpreted as pixels, string used as-is.           |
| `height`       | `SizeValue`                                                | —           | Section height; number interpreted as pixels, string used as-is.          |
| `maxWidth`     | `SizeValue`                                                | —           | Maximum width of section.                                                 |
| `minHeight`    | `SizeValue`                                                | —           | Minimum height of section.                                                |
| `children`     | `ReactNode`                                                | —           | Content rendered inside section.                                          |
| `dividers`     | `Array<'top' \| 'bottom' \| 'start' \| 'end'>`             | —           | Which sides of section have divider borders.                              |
| `padding`      | `0 \| 0.5 \| 1 \| 1.5 \| 2 \| 3 \| 4 \| 5 \| 6 \| 8 \| 10` | `4`         | Internal padding via spacing scale; 0 for edge-to-edge content.           |
| `paddingBlock` | `0 \| 0.5 \| 1 \| 1.5 \| 2 \| 3 \| 4 \| 5 \| 6 \| 8 \| 10` | —           | Block-axis padding override; preserves inline padding from padding/theme. |
| `xstyle`       | `StyleXStyles`                                             | —           | StyleX styles for layout customization; must be stylex.create() value.    |

## Theming

| Component class  | Preferred data attributes | Props                       | States |
| ---------------- | ------------------------- | --------------------------- | ------ |
| `astryx-section` | `data-variant`            | section, transparent, muted | —      |

Override in defineTheme:

```ts
components: {
  'section': {
    base: { /* CSS properties */ },
    'variant:value': { /* variant-specific */ },
  },
}
```

Related block templates:

CollapsibleSingleAccordion
Only one section open at a time. Use for settings pages or any list where expanding one item should close the others.
DividerFullBleed
Divider that extends past container padding to span the full width. Use inside cards or panels when you want a clean edge-to-edge separation, like between an order summary and total.
DividerVariants
Subtle, labeled, and strong dividers in a single card. Use subtle between related sections, labeled for alternatives like "or", and strong for high-contrast boundaries.
DividerVertical
Vertical dividers separating side-by-side metrics. Use between stat cards, toolbar groups, or any horizontal layout where you need a visual boundary between sections.
useKeyboardHintHookUsage
Toolbar shows an ephemeral "← → to navigate" hint on first keyboard focus via useKeyboardHint, teaching sighted keyboard users that arrows move within the group.
LayoutFullBleedContent
A layout where content extends edge-to-edge with zero padding, ideal for tables or images.
MediaThemeImageOverlay
A common image card pattern: place text and actions over a dark gradient and wrap the overlay content in MediaTheme mode="dark".
MediaThemeLightScrim
A light scrim over an image. Use MediaTheme mode="light" so text and ghost buttons use dark-on-light tokens.
MediaThemeShowcase
A compact media overlay showing MediaTheme adapting text, icons, badges, and button variants over an image-backed dark surface.
SectionVariants
All three background variants stacked: section (default surface), muted, and transparent. A quick visual reference for choosing the right variant.
SectionWashHighlight
A default section stacked with a full-width muted section. Shows how muted draws attention to a specific region like an upgrade prompt or banner.
SectionWithDividers
Adjacent sections separated by bottom dividers, like a settings page. Use dividers when stacking same-variant sections that need visual separation without a background change.
TablePaginatedTable
Paginated data table navigating through a larger dataset page by page.
ThemeApply
Wrap a subtree in Theme to apply a theme to every child component in that region.
ThemeNested
Nested Theme providers let a local region use a different theme without affecting the rest of the page.
ThemeShowcase
Two visually distinct theme providers wrapping identical content to show how Theme changes the visual treatment of child components.
ThemeSwitcher
Use state to switch the theme object passed to Theme and preview a different visual treatment.
ToolbarCardHeader
A toolbar as a card header with a left-aligned title and icon actions on the right. Use Toolbar instead of LayoutHeader when your card header has interactive actions; Toolbar adds start/end slot layout, keyboard navigation, and automatic size cascading. If the header is just a title with no actions, a LayoutHeader or Section is enough.
ToolbarThreeSlot
A toolbar with start, center, and end content using the three-column grid layout. Use when you need a centered title or heading with navigation and actions on either side.
ToolbarWithTabs
A toolbar with tabs in the start slot and an action button at the end. Use as a card or section header when content is split into tabs with a primary action alongside.

---

# Layout

Layout provides composable components for building structured page shells with header, sidebar, content, and footer slots. Use Layout for full app layouts and HStack/VStack for simple directional stacking.

**Import:** `import {Layout} from '@astryxdesign/core/Layout';`

## Best Practices

- **Do:** Use Layout for page shells that need distinct zones like header, sidebar(s), content, and footer.
- **Do:** Use HStack and VStack for simple directional stacking within a content area.
- **Don't:** Use Layout for simple stacking layouts; use HStack or VStack instead.
- **Don't:** Nest multiple Layout components; use one per page shell and compose content within its slots.

## Props

| Prop      | Type               | Default  | Description                                                                                                                                        |
| --------- | ------------------ | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `content` | `ReactNode`        | —        | Main content area (center). Children passed to `<Layout>` render here too: `<Layout>{main}</Layout>` is shorthand for `<Layout content={main} />`. |
| `header`  | `ReactNode`        | —        | Header slot.                                                                                                                                       |
| `footer`  | `ReactNode`        | —        | Footer slot.                                                                                                                                       |
| `start`   | `ReactNode`        | —        | Start panel (left in LTR).                                                                                                                         |
| `end`     | `ReactNode`        | —        | End panel (right in LTR).                                                                                                                          |
| `height`  | `'fill' \| 'auto'` | `'fill'` | Height behavior: fill the container or grow with content.                                                                                          |

## Components

### LayoutHeader

See `npx astryx component LayoutHeader` for props and usage.

### LayoutContent

See `npx astryx component LayoutContent` for props and usage.

### LayoutFooter

See `npx astryx component LayoutFooter` for props and usage.

### LayoutPanel

See `npx astryx component LayoutPanel` for props and usage.

### Card

See `npx astryx component Card` for props and usage.

### Section

See `npx astryx component Section` for props and usage.

## Theming

| Component class         | Preferred data attributes | Props  | States |
| ----------------------- | ------------------------- | ------ | ------ |
| `astryx-layout`         | `data-height`             | height | —      |
| `astryx-layout-content` | —                         | —      | —      |
| `astryx-layout-footer`  | —                         | —      | —      |
| `astryx-layout-header`  | —                         | —      | —      |
| `astryx-layout-panel`   | —                         | —      | —      |

Override in defineTheme:

```ts
components: {
  'layout': {
    base: { /* CSS properties */ },
    'height:value': { /* variant-specific */ },
  },
  'layout-content': {
    base: { /* CSS properties */ },
  },
}
```

Related block templates:

AppShellMobileHookUsage
Custom mobile navigation trigger built with useAppShellMobile. The trigger consumes the surrounding AppShell context instead of rendering its own shell.
AspectRatioShowcase
Three aspect ratio containers at equal height (1:1, 4:3, and 16:9), each showing an image with its ratio labeled below.
AvatarGroup
Overlap multiple avatars in a row to represent a group of people. Use for team lists, PR reviewers, or participant counts where you want to show faces without taking up much space.
AvatarInitialsFallback
Show initials instead of a photo. The avatar extracts the first and last initials from the name automatically. Use when you only have a user name, like in anonymous accounts or new user onboarding.
AvatarShowcase
Avatars at every size with an image, initials fallback, and a status dot. A quick visual reference for choosing the right size.
AvatarUserCard
Place an avatar next to a name and role to create a user card row. Use for comment headers, contact lists, profile sections, or anywhere you need to identify a person at a glance.
AvatarWithImage
Show a profile photo at different sizes. Use when you have a user photo URL. If the image fails to load, initials are shown instead.
AvatarWithStatus
Add a status dot to an avatar to show whether someone is online, away, or busy. Use in chat, messaging, or any UI where knowing availability matters.
AvatarGroupShowcase
Overlapping avatar rows with max limit and server-side overflow count. Shows team members in a compact facepile layout.
AvatarGroupOverflowCustomText
Provide short custom children such as 12+ when the overflow count needs compact product-specific formatting.
AvatarGroupOverflowDefault
Use AvatarGroupOverflow without children to render the standard +N overflow count.
AvatarGroupOverflowShowcase
Overflow indicators for hidden avatars, including the default +N label and custom count text.
BadgeCategoryTags
Tag items with color-coded categories like teams, priorities, or topics. Use the 9 non-semantic color variants when you need to distinguish groups visually.
BadgeCountBadges
Show a number inside a badge for notification counts, unread messages, or task totals. Use next to icons, nav items, or list labels.
BadgeShowcase
All semantic and color badge variants in a single view. Use semantic variants for status and color variants for categories.
BadgeStatusLabels
Show the state of an item like Active, Pending, or Failed. Use in table rows, list items, or detail pages where users need to see status at a glance.
BannerCollapsibleContent
Combine an action button, dismiss control, and expandable detail area in one banner. Use for complex notifications like config changes or deployment summaries.
BannerDismissable
Let the user close a banner after reading it. Use for maintenance notices, feature tips, or any non-critical message the user can acknowledge.
BannerSectionVariant
A full-width banner with no border radius for page-level notifications. Use at the top of a page for site-wide announcements or maintenance alerts.
BannerShowcase
All four status banners stacked: info, success, warning, and error. A quick visual reference for choosing the right status.
BannerStatuses
All 4 banner statuses: info, success, warning, and error. Use to show persistent messages like updates, confirmations, cautions, or problems at the top of a page or section.
BannerWithActionButton
Add a button to a banner so the user can act on the message. Use for trial expirations, payment failures, or anything that needs a response.
BaseTypeaheadCustomSearch
BaseTypeahead embedded inside a custom-styled wrapper. The wrapper provides its own border and icon chrome; anchorRef positions the dropdown relative to it. Use this pattern when Typeahead's built-in field layout does not fit your composition.
BlockquoteShowcase
Blockquote with and without citation. A quick visual reference for the blockquote component.
BlockquoteWithCite
A plain quote and a quote with a cite attribution. Use cite to credit the original author or source.
BreadcrumbsCustomSeparator
Swap the default "/" for a different character like chevrons, arrows, or dots. Use when the visual style of the page calls for a different separator.
BreadcrumbsSupportingVariant
Compare the default and supporting variants side by side. Use the supporting variant in dense UIs like admin panels where the breadcrumb should be subtle.
ButtonShowcase
All four button variants side by side: primary, secondary, ghost, and destructive. A quick visual reference for choosing the right variant.
ButtonSizeVariants
Small, medium, and large buttons side by side. Use small in dense UIs like toolbars, medium for most cases, and large for prominent CTAs.
ButtonVariants
All 4 button variants in default, disabled, and loading states. Use primary for the main action, secondary for most others, ghost for low-emphasis, and destructive for dangerous actions.
ButtonWithEndSlot
Buttons with a trailing badge showing a count or status. Use for notification counts, unread messages, or any button that needs a visual indicator.
ButtonWithIcon
Buttons with a leading icon that reinforces the label. Use when the icon helps the user identify the action faster, like a plus for "New" or a trash can for "Delete".
ButtonGroupShowcase
CalendarConstraints
Limit which dates can be selected using min/max bounds and custom rules like weekdays only. Use for scheduling UIs where certain dates are unavailable.
CalendarRangeWithValue
Pick a start and end date with the range highlighted between them. Use for booking dates, time-off requests, or report filters.
CalendarSingle
Pick one date from a month grid. Use for appointment dates, due dates, or any field that needs a single date.
CalendarTwoMonths
Two months side by side for selecting ranges that span a month boundary. Use in booking or travel UIs where check-in and check-out often fall in different months.
CardCallout
Muted-variant cards for tips, notes, or supplementary information. Use when content should be visually distinct but not prominent. The muted variant uses a wash background instead of the elevated default, making it feel recessed rather than raised. Works well in sidebars, help panels, or inline callouts.
CardShowcase
A card with a heading and body text showing the default container style.
CardVariants
Default, muted, and color variants side by side. Use color variants to categorize cards visually, like team colors, project tags, or content types. Each color uses the corresponding background token from the theme, so they adapt to light and dark mode automatically.
CardWithInnerLayout
A card with a structured header, content area, and footer with action buttons. Use for forms, dialogs, or settings panels that need clear sections. Pair Card with Layout to get automatic dividers between header, content, and footer. The footer aligns actions to the right by default.
CardWithSimpleContent
A card with a heading and body text. Use for summaries, descriptions, or any grouped content that needs visual separation from the page. The card handles its own border, background, and padding; just pass your content as children. Set a width to constrain it, or leave it to fill the parent.
ClickableCardShowcase
A clickable card that navigates on click. Nested interactive elements work independently.
ClickableCardWithNestedButton
A product card that navigates on click but has an independent "Add to cart" button inside.
SelectableCardMulti
Multi-select tag picker using color variant selectable cards with color-matched selection borders.
SelectableCardShowcase
A plan picker with single-select radio behavior. Cards show an accent border when selected.
CarouselCards
A horizontally scrollable row of cards with snap scrolling enabled. Use for feature grids, product lists, or any set of cards that overflows the available width. The carousel adds fade edges and navigation buttons automatically.
CarouselShowcase
A horizontal carousel of cards with scroll-snap and navigation buttons. Scroll or click the arrows to browse.
CarouselSnap
Scroll-snap carousel with navigation buttons and team member cards. Each card snaps to the start edge on scroll. Use when items should be viewed one at a time rather than as a continuous strip.
CenterHorizontal
An editor toolbar with a document title on the left and formatting actions on the right. This shows axis="horizontal", centering in one direction only. Use when content needs to be horizontally centered while other elements are positioned independently around it.
CenterInsideACard
An empty state with an icon, heading, and description centered both vertically and horizontally inside a card. This is the most common use of Center: placing content in the middle of a fixed-height area like a panel, card, or content region. The height prop defines the centering space.
CenterShowcase
Content centered horizontally and vertically inside a fixed-height container.
ChatComposerAttachments
Chat composer with removable file tokens in a collapsible drawer. Use when users can attach files or context to their message.
ChatComposerFooterActions
Chat composer with dropdown menus for a model selector and settings in the footer, and a mic button in the send actions slot.
ChatComposerFullFeatured
Chat composer with all slots populated: collapsible attachment drawer, header actions, context progress bar, footer dropdown menus, and mic button. Shows the maximum composer configuration.
ChatComposerShowcase
ChatComposerSimple
Minimal chat composer with a placeholder and submit handler. The simplest way to drop a message input into a page.
ChatComposerStreaming
Chat composer with streaming state and a stop button. Use when the assistant is generating a response and the user can cancel.
ChatComposerValidation
Chat composer with error and warning status messages. Status can appear above or below the composer to surface validation or system feedback.
ChatComposerDrawerAttachments
Drawer with two rows: a scrollable carousel of image thumbnails and a row of removable file tokens. Omit count to keep the drawer always expanded.
ChatComposerDrawerCollapsible
Drawer with many items and a collapse toggle. Pass count to enable the toggle; collapsed state shows a badge with the total count and a label.
ChatComposerDrawerFeedback
Chat composer drawer with a feedback prompt and selectable lettered options. Use for user confirmation workflows that require explicit action before proceeding.
ChatComposerDrawerShowcase
Composer drawer with file tokens, a collapsible toggle, and header actions. Use as a starting point for any chat composer with attachments.
ChatComposerDrawerWithProgress
Drawer paired with a context progress bar in the header. Show context window usage when attachments consume part of the available token budget.
ChatComposerInputControlledInput
Controlled chat input with live value display. Use controlled mode when you need to read or transform the input value outside the composer.
ChatComposerInputDisabled
Composer in a disabled state. Use when the input should be visible but not interactive, such as during streaming or when a prerequisite is unmet.
ChatComposerInputMentionTrigger
Chat input with an @ trigger that opens a typeahead menu for mentioning users. Selected names appear as inline tokens.
ChatComposerInputMultipleTriggers
Chat input with both @ mentions and / commands. Each trigger type renders tokens in a distinct color so users can tell them apart at a glance.
ChatComposerInputShowcase
ChatComposerInputSlashCommands
Chat input with a / trigger for command selection. Use for AI assistants or bots that support structured commands.
ChatDictationDictationInComposer
Dictation button placed in the sendActions slot of a chat composer. Shows the recommended integration point for voice input alongside the send button.
ChatDictationDictationStates
Dictation button in idle, listening, and speaking states side by side. Shows the three visual phases of a voice input interaction.
ChatDictationSizes
Small and medium dictation buttons side by side. Use small in compact composer densities and medium for standard layouts.
ChatLayoutScrollButtonLabels
Scroll button with different labels for context-specific notifications like new messages, unread replies, or a generic scroll prompt.
ChatLayoutScrollButtonStates
Scroll button in hidden, visible, and expanded (with label) states. The button fades in when the user scrolls up and expands when new messages arrive.
ChatMessageAvatarName
Messages with avatars and sender names. Place the name on the bubble when using bubbles, or on the message wrapper for raw content.
ChatMessageGhost
Ghost variant for messages without visible bubble boundaries. Keeps padding for alignment but renders a transparent background, useful for AI-style responses.
ChatMessageMultiBubble
Grouped bubbles using the group prop for corner radius reduction. Use first, middle, and last to visually connect related bubbles from the same sender.
ChatMessageShowcase
A user multi-bubble group with delivery status and an assistant ghost response with avatar, name, timestamp, and model info.
ChatMessageBubbleDensity
Compact, balanced, and spacious density modes side by side. Density controls bubble padding, corner radius, and spacing between grouped bubbles.
ChatMessageBubbleGrouping
Multi-bubble messages using first, middle, and last group positions. Grouped bubbles tighten corner radius on the sender side for a continuous visual flow.
ChatMessageBubbleMetadata
Bubbles with name and metadata slots aligned to bubble padding. Put name on the first bubble and metadata on the last bubble in a message.
ChatMessageBubbleVariants
Filled and ghost bubble variants for both user and assistant senders. Use filled for standard messages and ghost when content needs alignment without a visual boundary.
ChatMessageListDensity
Side-by-side comparison of compact, balanced, and spacious densities. Use compact in sidebars or panels, balanced for most full-page chat, and spacious for long-form reading. Use gap when row spacing needs to differ from density.
ChatMessageListFullFeatured
Conversation showcasing system messages, multi-bubble grouping, markdown, code blocks, and metadata. Combines date dividers, ghost bubbles, grouped messages, and rich content in a single example.
ChatMessageListShowcase
Basic AI chat conversation with user and assistant messages. The simplest way to render a message list with alternating sender bubbles, metadata, and a date divider.
ChatMessageMetadataFooter
Assistant message with footer actions: copy, retry, thumbs up/down, and model label. Use for AI responses that need feedback or utility controls.
ChatMessageMetadataShowcase
Three-message conversation showcasing error status with retry, delivery status, and full footer actions with model label.
ChatSendButtonCustomIcon
Send buttons with custom icons via sendIcon and stopIcon props. Use to match the personality of the chat experience: a paper airplane for messaging, sparkles for AI generation, or a check mark for confirmation flows.
ChatSendButtonInComposer
Send button inside ChatComposer, where it reads state from context automatically. No wiring needed; the button enables when the input has content.
ChatSendButtonShowcase
Ready, custom icon, and streaming states of the send button.
ChatSendButtonStates
Disabled, ready, and streaming states at both sizes. The button automatically toggles between send (primary) and stop (secondary) based on streaming state.
ChatSystemMessageVariants
Default and divider variants side by side. Use default for inline status updates and divider for date separators or section breaks.
ChatSystemMessageWithIcon
System messages with a leading icon that reinforces the message type. Use icons to help users scan and identify message categories at a glance.
ChatToolCallsToolCallsWithNodes
A single inline tool call above a collapsible multi-call group with diff stats. Shows both layouts side by side.
CheckboxInputBasic
Checkboxes with labels and descriptions in checked, unchecked, and disabled states. Each checkbox controls a single on/off setting. Add a description to explain what the setting does.
CheckboxInputIndeterminateState
A "select all" checkbox that controls a group of options. When only some options are checked, it shows a dash instead of a checkmark. Clicking it checks or unchecks everything.
CheckboxInputShowcase
Interactive checkboxes showing checked, unchecked, and indeterminate states with descriptions.
CheckboxInputStatusVariations
Checkboxes with error, warning, and success validation messages. Use the status prop to show feedback after form validation: errors block submission, warnings inform, and success confirms.
CitationShowcase
All citation variants at a glance: label chips and numbered badges, with and without icons and links.
CitationSourceList
A list of citation sources with icons, as you might show at the end of an AI-generated response or article footer.
CodeShowcase
Inline code snippets inside a sentence showing how Code renders alongside body text.
CollapsibleControlledAccordion
Manage the open section from parent state. Use when the open state needs to sync with a URL param, form, or external control.
CollapsibleHookUsage
Custom disclosure UI built directly with useCollapsible for headless open/close state.
CollapsibleMultipleAccordion
Several sections open at once. Use when users need to compare content across sections, like feature lists or pricing tiers.
CollapsibleSingleAccordion
Only one section open at a time. Use for settings pages or any list where expanding one item should close the others.
CollapsibleWithoutCard
Collapsible sections separated by dividers instead of cards. Use for inline disclosure in detail panels or sidebar content where cards would add too much weight.
CommandPaletteGroupShowcase
Command palette groups in both data-driven (auxiliaryData.group) and composed (CommandPaletteGroup + CommandPaletteItem) forms.
CommandPaletteItemShowcase
Command palette items with custom content via renderItem and as composed CommandPaletteItem with icons, highlighted, selected, and disabled states.
DateInputClearable
Date input with a clear button that resets the value. Use when the date field is optional and the user may need to undo their selection.
DateInputDateRange
Date input constrained to a min/max window. Use when only certain dates are valid, like booking availability or a fiscal quarter.
DateInputShowcase
A date input field with a calendar popover. Type a date or click the calendar icon to pick one.
DateInputWithDescription
Date input with helper text below the label explaining what the field expects. Use when the purpose of the date is not obvious from the label alone.
DateInputWithValidation
Date input in all three status states: error, warning, and success. Use to surface validation issues, caution the user, or confirm a valid selection.
DateRangeInputShowcase
A date range picker with a button trigger and dual-month calendar popover with preset ranges.
DateRangeInputWithPresets
Date range picker with quick-select presets for common periods. Use for analytics dashboards, report filters, or any context where users frequently select standard time windows.
DateRangeInputWithValidation
Date range input in all three status states: error, warning, and success. Use to surface booking conflicts, flag high-demand periods, or confirm an available range.
DateTimeInputShowcase
A combined date and time picker. Click to open a calendar popover with a time input below.
DateTimeInputWithValidation
DateTimeInput in all three status states: error, warning, and success. Use to surface scheduling conflicts, caution the user about edge cases, or confirm a valid datetime.
DialogConfirmationDialog
Asks the user to confirm a destructive action before it happens. Use before deleting projects, removing team members, revoking API keys, or any irreversible operation.
DialogFormDialog
Collects user input without navigating away from the page. Uses purpose="form" so clicking the backdrop won't close it. Use for editing profiles, creating items, or updating settings inline.
DialogFullscreenDialog
Takes over the entire viewport for content that needs maximum space. Use for documentation viewers, rich text editors, multi-step wizards, or media previews where the standard dialog width is too narrow.
DialogScrollingContent
Constrains the dialog height and scrolls the body when content overflows. Use for terms and conditions, license agreements, changelogs, or any long-form content the user needs to review before accepting.
DialogShowcase
Modal dialog with a header, body content, and close button.
DialogWithSubtitle
Cannot be dismissed by Escape or backdrop click; the user must explicitly choose an action. Uses purpose="required". Use for ownership transfers, legal acknowledgements, or critical decisions where skipping is not an option.
DialogHeaderBasic
A DialogHeader with a title, subtitle, and close button, placed in the header slot of a Dialog Layout. Pass onOpenChange to render the close button.
DividerFullBleed
Divider that extends past container padding to span the full width. Use inside cards or panels when you want a clean edge-to-edge separation, like between an order summary and total.
DividerShowcase
Horizontal dividers in subtle and strong variants, plus a labeled divider. A quick visual reference for separator styles.
DividerVariants
Subtle, labeled, and strong dividers in a single card. Use subtle between related sections, labeled for alternatives like "or", and strong for high-contrast boundaries.
DividerVertical
Vertical dividers separating side-by-side metrics. Use between stat cards, toolbar groups, or any horizontal layout where you need a visual boundary between sections.
DropdownMenuActions
Action menu with dividers separating safe and destructive operations. Use for row-level actions on items like documents, projects, or records.
DropdownMenuNoChevron
Overflow menu triggered by an icon-only button with no chevron or label text. Use for row-level actions in tables, cards, or lists where a text button would take too much space.
DropdownMenuWithDisabledItems
Menu with selectively disabled items based on permissions. Use when some actions require higher privileges, like admin-only operations.
DropdownMenuWithSections
Menu items organized into titled sections for easy scanning. Use when you have 6+ actions that fall into distinct categories, like Create vs Manage.
EmptyStateCompact
Smaller empty state with reduced spacing for constrained areas. Use inside sidebar panels, card widgets, or notification drawers where a full-size empty state would overwhelm the layout.
FieldRequired
Required and optional field indicators side by side. Use isRequired on fields the user must fill in, and isOptional to clarify which fields can be skipped.
FieldShowcase
A form field wrapping a text input with a label, description, and validation status.
FieldStatusVariants
All three validation states: error, warning, and success. Use error for invalid input, warning for potential issues like reserved names, and success to confirm valid entries like API keys.
FieldWithDescription
Fields with helper text below the label. Use descriptions to explain format requirements, constraints, or what happens with the data, like "At least 8 characters" or "We will send a confirmation link".
FieldStatusShowcase
Field status messages in error, warning, and success states with attached and detached variants.
GridResponsiveAutoFit
Responsive grid where cards stretch to fill remaining space
HStackShowcase
Demonstrates HStack arranging items horizontally with different gaps and alignments.
HeadingShowcase
useKeyboardHintHookUsage
Toolbar shows an ephemeral "← → to navigate" hint on first keyboard focus via useKeyboardHint, teaching sighted keyboard users that arrows move within the group.
useStreamingTextHookUsage
Smooth bursty generated text into a steady reveal with useStreamingText.
HoverCardHookUsage
Custom profile preview using useHoverCard with direct trigger and render control.
HoverCardInlineTextHoverCard
Shows a term definition on hover within a paragraph. Use for technical terms, jargon, or concepts that some readers may not know, like a glossary built into the text.
HoverCardInteractiveContent
Shows a page summary when hovering a link: title, description, and URL. Use for documentation links, article references, or any URL where a preview helps the user decide whether to click.
HoverCardProfileHoverCard
Shows a user profile summary on hover with name, role, and bio. Use on usernames, avatars, or mentions to let users preview a profile without navigating away.
HoverCardShowcase
A hover card that shows a user profile preview when hovering over a trigger button. Starts open for preview.
InputGroupShowcase
ItemBasicItem
A basic item with a label, supporting description, and end-aligned timestamp. Use this for simple rows that need consistent text alignment and spacing.
ItemShowcase
ItemWithMedia
Items with leading avatars and icons in the startContent slot. Keep start content small so the row stays compact and easy to scan.
ItemWithMetadata
Items with end-aligned metadata and badges. Use the endContent slot for counts, status, timestamps, and other secondary row information.
LayerHookUsage
Low-level anchored overlay rendered with useLayer and a custom surface.
LayoutBasicCardLayout
A card layout with header, scrollable content area, and footer with action buttons.
LayoutContentOnlyLayout
A minimal layout with just a content area inside a card, without header or footer.
LayoutContentWidth
A layout using contentWidth to constrain and center content while keeping dividers full-bleed.
LayoutDualPanelLayout
A file browser style layout with start panel for folders, main content for files, and end panel for details.
LayoutFullBleedContent
A layout where content extends edge-to-edge with zero padding, ideal for tables or images.
LayoutShowcase
LayoutSidebarLayout
A settings page layout with a navigation sidebar panel, content area, header, and footer.
LayoutContentBasic
A scrollable main content area below a fixed header. Use LayoutContent inside Layout to get automatic padding and scroll containment for the primary content.
LayoutContentShowcase
LayoutContent is the scrollable main content area within a Layout, providing automatic padding and scroll containment between the header and footer.
LayoutFooterActions
A fixed footer with end-aligned action buttons below scrollable content. Use LayoutFooter inside Layout for persistent actions like Save and Cancel.
LayoutFooterShowcase
LayoutFooter is a fixed footer slot within a Layout, pinned to the bottom for persistent actions like form buttons or navigation.
LayoutHeaderShowcase
LayoutHeader is a fixed header slot within a Layout, pinned to the top for titles, navigation, and action buttons.
LayoutHeaderWithActions
A fixed page header with a title and a primary action, above scrollable content. Use LayoutHeader inside Layout for persistent page-level headers.
LayoutPanelNavigation
A fixed-width side panel holding a navigation list next to the main content. Use LayoutPanel in the start or end slot of Layout for sidebars.
LayoutPanelShowcase
LayoutPanel is a sidebar slot within a Layout, used for navigation, detail views, or secondary content alongside the main content area.
MediaThemeImageOverlay
A common image card pattern: place text and actions over a dark gradient and wrap the overlay content in MediaTheme mode="dark".
MediaThemeLightScrim
A light scrim over an image. Use MediaTheme mode="light" so text and ghost buttons use dark-on-light tokens.
MediaThemeShowcase
A compact media overlay showing MediaTheme adapting text, icons, badges, and button variants over an image-backed dark surface.
OutlineControlled
Drive the active section yourself with activeId and onActiveIdChange. Providing activeId disables the built-in scroll-spy so your own logic owns the highlight.
OutlineDensity
Two density variants control item padding. Use compact for dense sidebars and default for standard documentation layouts. The sliding indicator automatically matches each item height.
OverlayBottomStrip
Places compact supporting content in a bottom scrim strip without covering the entire image.
OverlayShowcase
A media card with an always-visible scrim and centered action content.
PaginationDotsCarousel
A review carousel using dot pagination to step through testimonial cards. Use the dots variant for carousels, galleries, and any paged content where the total is small and visible position matters more than a page number.
PaginationPageSize
A transactions table with pagination and a page size dropdown at the bottom. Shows how pagination works as a footer below real content, with adjustable rows per page.
PaginationVariants
All four display variants stacked: dots, compact, count, and pages. A quick visual reference for choosing the right variant.
PaginationWithTable
Pagination below a data table with client-side page slicing. Use the count variant with small size for dense data views where users need to see item ranges.
PopoverConfirmAction
Inline confirmation popover for destructive actions with delete and cancel buttons.
PopoverFilterPanel
Popover with checkbox filters and apply/reset actions.
PopoverHookUsage
Custom quick-actions popover using usePopover for trigger refs, ARIA attributes, and focus trapping.
PopoverKeyboardShortcuts
Popover displaying a list of keyboard shortcuts with key and description pairs.
PopoverSettingsPanel
Popover with toggle switches for managing user preferences like notifications, dark mode, and sounds.
PopoverShowcase
PowerSearchSearchWithTable
Composition of PowerSearch with Table using usePowerSearchConfig to auto-generate config and filter data.
ResizableShowcase
Horizontal resizable split with a draggable handle between two panels.
ResizableSidebar
A collapsible sidebar with snap points, driven by useResizable. Dragging snaps to preset widths, dragging past the minimum collapses the panel, and the expand method restores it programmatically.
SectionVariants
All three background variants stacked: section (default surface), muted, and transparent. A quick visual reference for choosing the right variant.
SectionWashHighlight
A default section stacked with a full-width muted section. Shows how muted draws attention to a specific region like an upgrade prompt or banner.
SectionWithDividers
Adjacent sections separated by bottom dividers, like a settings page. Use dividers when stacking same-variant sections that need visual separation without a background change.
StackAlignment
Buttons positioned at the start, center, and end of a row.
StackDirections
Badges arranged horizontally and vertically in side-by-side cards.
StackFillItem
An avatar, text, and button in a row; the text stretches to fill the available space.
SyntaxThemeShowcase
A concise code block rendered with the One Dark Pro syntax preset to show how SyntaxTheme changes highlighting colors without making the page long.
TableColumnSettingsTable
Table with a column visibility picker in the toolbar. Toggle columns on and off.
TableInCard
Table composed inside a card with a heading, demonstrating container bleed alignment.
TextAreaStates
Required, disabled, and loading textareas side by side. Shows the interactive states the component supports.
TextAreaValidation
All three status variants (error, warning, and success) with status messages, plus error without a message. Use to show inline validation feedback as the user types.
TextInputIcon
Inputs with a leading icon that hints at the expected content. Use when the icon helps users identify the field faster, like a lock for passwords or an envelope for email.
TextInputSearch
Search input with a hidden label, start icon, and clear button. Use for toolbar and header search bars where the icon provides sufficient context.
TextInputSizes
Small, medium, and large inputs side by side. Use small in dense UIs like table filters, medium for most forms, and large for prominent single-field pages.
TextInputStates
Error, warning, and success validation states with status messages. Use to show users what went wrong and how to fix it.
TextInputTypes
Text, password, and email types plus field-level features: tooltip, required, optional, description, disabled, and loading.
ThemeApply
Wrap a subtree in Theme to apply a theme to every child component in that region.
ThemeNested
Nested Theme providers let a local region use a different theme without affecting the rest of the page.
ThemeShowcase
Two visually distinct theme providers wrapping identical content to show how Theme changes the visual treatment of child components.
ThemeSwitcher
Use state to switch the theme object passed to Theme and preview a different visual treatment.
useThemeHookUsage
Read resolved theme token values with useTheme for non-CSS consumers like SVG charts.
ThumbnailDisabled
Thumbnails in the disabled state with reduced opacity. The remove button and click handler are suppressed when disabled.
ThumbnailGallery
A row of clickable thumbnails with labels that open a detail view. Use for image attachment lists where users need to preview and manage uploads.
ThumbnailRemovable
Thumbnails with a remove button overlay. The close button uses APCA luminance detection to stay visible on both dark and light images.
ThumbnailStates
All visual states side by side: image loaded, placeholder, skeleton loading, and upload overlay. Demonstrates the full lifecycle of a thumbnail from empty to loaded.
TimeInputConstrained
Time inputs with min/max constraints limiting selection to specific windows. Use to prevent out-of-bounds selections for appointments, reservations, or shift scheduling.
TimeInputFormats
12-hour, 24-hour, and seconds formats side by side. Use 12h for US-centric UIs, 24h for international or technical contexts, and seconds for precise timing.
TimeInputIncrement
Time input with a custom step increment. Arrow keys jump by the specified interval (e.g. 15 minutes) for quick slot-based scheduling.
TimeInputStates
Default, disabled, error, warning, and success states. Use status messages to give users clear feedback about their time selection.
TimestampAutoFormat
Auto format that shows relative time for recent dates and switches to the full date for older ones. The default choice for most use cases.
TimestampFormats
All display formats side by side: date, date_time, time, and their system equivalents. Use date and date_time for user-facing UI, system variants for logs and dev tools.
TimestampRelativeFormat
Relative time labels from seconds to months ago, with hover tooltips showing the full date. Use in feeds, comment threads, and activity logs.
TimestampTimezone
Timestamps with the timezone abbreviation appended. Enable isTimezoneShown for audiences across time zones, like audit logs or team calendars.
ToastAction
Persistent toasts with a trailing button or link so the user can act on the notification, like undoing a delete or viewing a report.
ToastDeduplication
Prevent duplicate toasts with uniqueID. Use ignore to keep the first toast, or overwrite to replace it with updated content like a progress percentage.
ToastDismiss
Show a persistent toast and dismiss it programmatically using the function returned by useToast. Use for long-running operations that need manual cleanup.
ToastStacking
Multiple toasts stacking vertically with smooth enter and exit animations. Click repeatedly to see how toasts queue and dismiss.
ToastTypes
Info and error toast variants side by side. Info toasts auto-dismiss after 5 seconds, error toasts persist until the user dismisses them.
ToggleButtonColor
Toggle buttons with colored icons in the pressed state. Shows accent-colored toolbar formatting and semantic reaction colors (yellow star, red heart, blue bookmark).
ToggleButtonGroup
Toggle button groups in single-select and multi-select modes. Single selection acts as a view mode switcher; multiple selection forms a formatting toolbar.
ToggleButtonIconSwap
Icon-only toggle buttons that swap between outline and solid icons when pressed. Use for actions like favorite, bookmark, or mute where the icon itself communicates the state.
ToggleButtonLabel
Toggle buttons with visible text labels that show a font weight shift on press. Use when the icon alone is not enough to communicate the action.
ToggleButtonShowcase
ToggleButtonStates
Default, pressed, disabled, and loading states of a standalone toggle button. Shows how visual treatment changes across states.
ToggleButtonGroupVertical
A vertically stacked ToggleButtonGroup using the vertical orientation, shown with both single-select and multi-select behavior, ideal for sidebar-style option lists and vertical toolbars.
TokenClickable
Interactive tokens that respond to clicks. Use for toggleable filters or tokens that open a detail view when selected.
TokenColors
All 11 color variants in default and disabled states. Use color to categorize entities or convey status at a glance.
TokenEndContent
Tokens with trailing content like a count badge or status indicator after the label. Use for notification counts, item quantities, or compact status info.
TokenIcon
Tokens with a leading icon that identifies the entity type. Use when the icon helps users recognize the token category faster, like a user icon for people or a tag icon for labels.
TokenRemovable
Tokens with a dismiss button for selections the user can undo. Use in multi-select fields, active filters, or any list of user-chosen items.
TokenShowcase
TokenizerClear
Tokenizer with a built-in clear-all button for bulk removal of all selected tokens.
TokenizerCreatable
Free-text tokenizer for creating custom tags and a combined create-or-search pattern. Use when users need to enter values that may not exist in a predefined list.
TokenizerEndContent
Tokenizer with an action button in the end slot. Use for inline actions like applying selections alongside the input.
TokenizerIcon
Tokenizer with a leading search icon to visually reinforce the search behavior.
TokenizerMaxEntries
Tokenizer with a maximum selection limit. The input hides automatically when the limit is reached, preventing further additions.
TokenizerOverflow
Tokenizer with overflow truncation when unfocused. Inline mode pushes content down on expand; layer mode overlays without shifting layout.
TokenizerStates
Tokenizer in disabled, error, warning, and success states. Use to communicate validation feedback or lock a selection from editing.
ToolbarSizes
Small, medium, and large toolbars side by side. The size prop cascades to child buttons and inputs automatically. Use small in dense UIs like cards, medium for most cases, and large for spacious layouts.
ToolbarTableFilter
A compact toolbar with a search input, Status and Priority filter selectors, and an overflow menu. Use above a data table to let users search, filter, and access view options.
VStackShowcase
Demonstrates VStack arranging items vertically with different gaps.

---

# Link

A styled anchor for inline and standalone text navigation. Supports external links, underline variants, tooltips, and custom link components for router integration. Use it for navigating between pages or to external URLs.

**Import:** `import {Link} from '@astryxdesign/core/Link';`

## Anatomy

| Element    | Required | Description                                                   |
| ---------- | -------- | ------------------------------------------------------------- |
| Label      | Yes      | The visible text of the link.                                 |
| Right icon | No       | Icon placed after the label to indicate an action affordance. |
| Left icon  | No       | Icon placed before the label to represent meaning.            |

## Best Practices

- **Do:** Write descriptive, concise link text that clearly communicates the destination.
- **Do:** Set `isStandalone` when the link appears outside of inline text, so it receives proper base font sizing.
- **Do:** Only set `label` when the link content is not descriptive text (e.g. an icon-only link). For text links, the visible text is already the accessible name; adding `label` overrides it for screen readers, which is harmful.
- **Don't:** Use Link for actions that do not navigate; use a Button instead.
- **Don't:** Use generic text like "click here" or "read more"; describe the destination.
- **Don't:** Set `label` on text links; `aria-label` prevents assistive technology from reading the actual link content.

## Components

### Link

Styled anchor link w/ variants, external link support, polymorphic rendering.

| Prop             | Type                | Default                | Description                                                                    |
| ---------------- | ------------------- | ---------------------- | ------------------------------------------------------------------------------ |
| `as`             | `LinkComponentType` | —                      | Custom component to render instead of <a>                                      |
| `label`          | `string`            | —                      | Accessible label (aria-label). Only for non-text content like icon-only links. |
| `href`           | `string`            | —                      | Link destination URL                                                           |
| `hasUnderline`   | `boolean`           | `false`                | Always show underline                                                          |
| `isDisabled`     | `boolean`           | `false`                | Disables link                                                                  |
| `isExternalLink` | `boolean`           | `false`                | Opens new tab w/ external icon and safe rel tokens                             |
| `newTabLabel`    | `string`            | `'(opens in new tab)'` | SR text announcing an external link opens in a new tab                         |
| `target`         | `string`            | —                      | Where to open linked document. target="\_blank" auto-adds noopener noreferrer. |
| `rel`            | `string`            | —                      | Link relationship tokens. noopener noreferrer are merged for target="\_blank". |
| `onClick`        | `MouseEventHandler` | —                      | Click event handler                                                            |
| `tooltip`        | `string`            | —                      | Tooltip text on hover                                                          |
| `isStandalone`   | `boolean`           | `false`                | Applies base font sizing                                                       |
| `children`       | `ReactNode`         | —                      | Link content **(required)**                                                    |

### LinkProvider

Provider setting default link component for all Astryx links in subtree.

| Prop        | Type                | Default | Description                                    |
| ----------- | ------------------- | ------- | ---------------------------------------------- |
| `component` | `LinkComponentType` | —       | Component for all link elements **(required)** |
| `children`  | `ReactNode`         | —       | Subtree **(required)**                         |

## Theming

| Component class | Preferred data attributes | Props | States |
| --------------- | ------------------------- | ----- | ------ |
| `astryx-link`   | `data-color`              | color | —      |

Override in defineTheme:

```ts
components: {
  'link': {
    base: { /* CSS properties */ },
    'color:value': { /* variant-specific */ },
  },
}
```

Related block templates:

HoverCardInteractiveContent
Shows a page summary when hovering a link: title, description, and URL. Use for documentation links, article references, or any URL where a preview helps the user decide whether to click.
LinkExternalLinks
A vertical list of external links that open in a new tab with an indicator icon.
LinkInlineLink
A link embedded within a paragraph of body text.
LinkShowcase
A standalone link.
LinksWithTooltips
Horizontal row of standalone links with descriptive hover tooltips.
LinkProviderCustomLink
Routes every Astryx link through a custom component that intercepts the click, the hook frameworks like Next.js use for client-side navigation. Click the link to see the custom handler fire instead of a full-page load.
TableRichCellTable
Table with rich cell content using Link for emails and Badge for role labels.
ToastAction
Persistent toasts with a trailing button or link so the user can act on the notification, like undoing a delete or viewing a report.

---

# Icon

Icons are small visual symbols that represent actions, objects, or concepts. They improve scannability and reinforce meaning alongside text. Supports both direct SVG components and semantic icon names that adapt to the active theme.

**Import:** `import {Icon} from '@astryxdesign/core/Icon';`

## Best Practices

- **Do:** Use semantic icon names when available; they adapt to theme changes automatically.
- **Do:** Pair icons with text labels for accessibility; icon-only elements need an accessible label.
- **Do:** Use color tokens for icon colors, not hardcoded hex values.
- **Do:** Be mindful of context; decorative icons in compact components can distract rather than help.
- **Don't:** Use icons as the sole means of conveying meaning; always provide a text alternative.
- **Don't:** Resize icons with arbitrary pixel values; use the provided size props.
- **Don't:** Mix icon styles (e.g. outline and filled) within the same context.
- **Don't:** Render raw SVG elements; always wrap in Icon for consistent sizing and color.
- **Don't:** `name` prop, which does not exist. Use `icon` to specify which icon to render.

## Props

| Prop    | Type                                                                                                                 | Default     | Description                                                                                                                                                                                                                                                                                                                                                         |
| ------- | -------------------------------------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `icon`  | `IconName \| ComponentType<SVGProps>`                                                                                | —           | Semantic icon name or SVG component. Valid names: close, chevronDown, chevronLeft, chevronRight, check, success, error, warning, info, calendar, clock, externalLink, menu, moreHorizontal, search, arrowUp, arrowDown, arrowsUpDown, funnel, eyeSlash, viewColumns, copy, checkDouble, wrench, stop, microphone. For others, pass an SVG component. **(required)** |
| `color` | `'primary' \| 'secondary' \| 'tertiary' \| 'disabled' \| 'accent' \| 'success' \| 'error' \| 'warning' \| 'inherit'` | `'inherit'` | Color variant mapped to Astryx icon color tokens.                                                                                                                                                                                                                                                                                                                   |
| `size`  | `'xsm' \| 'sm' \| 'md' \| 'lg'`                                                                                      | `'md'`      | Icon size.                                                                                                                                                                                                                                                                                                                                                          |
| `label` | `string`                                                                                                             | —           | Accessible name for a meaningful, standalone icon. Sets role="img" + aria-label and drops the default aria-hidden. Omit (default) for decorative icons (stays aria-hidden). Empty string = decorative. The accessible-name/alt-text prop for icons.                                                                                                                 |

## Theming

| Component class | Preferred data attributes | Props       | States |
| --------------- | ------------------------- | ----------- | ------ |
| `astryx-icon`   | `data-color`, `data-size` | color, size | —      |

Override in defineTheme:

```ts
components: {
  'icon': {
    base: { /* CSS properties */ },
    'color:value': { /* variant-specific */ },
  },
}
```

Related block templates:

BaseTypeaheadCustomSearch
BaseTypeahead embedded inside a custom-styled wrapper. The wrapper provides its own border and icon chrome; anchorRef positions the dropdown relative to it. Use this pattern when Typeahead's built-in field layout does not fit your composition.
BreadcrumbsDeepHierarchy
A 5-level breadcrumb trail for deeply nested content. Use in e-commerce, file browsers, or any UI with several levels of hierarchy.
BreadcrumbsWithIcons
Add icons before breadcrumb labels for quick recognition. Use a home icon on the root item and contextual icons on key sections.
ButtonWithIcon
Buttons with a leading icon that reinforces the label. Use when the icon helps the user identify the action faster, like a plus for "New" or a trash can for "Delete".
ButtonGroupShowcase
CenterHorizontal
An editor toolbar with a document title on the left and formatting actions on the right. This shows axis="horizontal", centering in one direction only. Use when content needs to be horizontally centered while other elements are positioned independently around it.
CenterInsideACard
An empty state with an icon, heading, and description centered both vertically and horizontally inside a card. This is the most common use of Center: placing content in the middle of a fixed-height area like a panel, card, or content region. The height prop defines the centering space.
ChatComposerFooterActions
Chat composer with dropdown menus for a model selector and settings in the footer, and a mic button in the send actions slot.
ChatComposerFullFeatured
Chat composer with all slots populated: collapsible attachment drawer, header actions, context progress bar, footer dropdown menus, and mic button. Shows the maximum composer configuration.
ChatComposerDrawerShowcase
Composer drawer with file tokens, a collapsible toggle, and header actions. Use as a starting point for any chat composer with attachments.
ChatComposerDrawerWithProgress
Drawer paired with a context progress bar in the header. Show context window usage when attachments consume part of the available token budget.
ChatMessageBubbleMetadata
Bubbles with name and metadata slots aligned to bubble padding. Put name on the first bubble and metadata on the last bubble in a message.
ChatMessageMetadataFooter
Assistant message with footer actions: copy, retry, thumbs up/down, and model label. Use for AI responses that need feedback or utility controls.
ChatMessageMetadataShowcase
Three-message conversation showcasing error status with retry, delivery status, and full footer actions with model label.
ChatSendButtonCustomIcon
Send buttons with custom icons via sendIcon and stopIcon props. Use to match the personality of the chat experience: a paper airplane for messaging, sparkles for AI generation, or a check mark for confirmation flows.
ChatSendButtonShowcase
Ready, custom icon, and streaming states of the send button.
ChatSystemMessageStatusUpdates
Realistic status messages in a conversation flow showing membership changes, timestamps, and resolution notices.
ChatSystemMessageWithIcon
System messages with a leading icon that reinforces the message type. Use icons to help users scan and identify message categories at a glance.
CommandPalettePickerMode
Single-value picker with persistent selection and check indicator.
CommandPaletteItemShowcase
Command palette items with custom content via renderItem and as composed CommandPaletteItem with icons, highlighted, selected, and disabled states.
DropdownMenuNoChevron
Overflow menu triggered by an icon-only button with no chevron or label text. Use for row-level actions in tables, cards, or lists where a text button would take too much space.
EmptyStateActions
Full empty state with icon, message, and action buttons. Use when a search returns no results, a filter clears all items, or a list has been emptied. The buttons give the user a way forward: go back, clear filters, or try a different query.
EmptyStateCompact
Smaller empty state with reduced spacing for constrained areas. Use inside sidebar panels, card widgets, or notification drawers where a full-size empty state would overwhelm the layout.
EmptyStateContainer
Empty state wrapped in a Card for first-time setup or onboarding. Use when the user has not created any items yet, like a project list, team roster, or dashboard widget that will fill with data once they take action.
EmptyStateShowcase
A no-results empty state with an icon, descriptive message, and a call-to-action button.
useKeyboardHintHookUsage
Toolbar shows an ephemeral "← → to navigate" hint on first keyboard focus via useKeyboardHint, teaching sighted keyboard users that arrows move within the group.
HoverCardInteractiveContent
Shows a page summary when hovering a link: title, description, and URL. Use for documentation links, article references, or any URL where a preview helps the user decide whether to click.
IconNonSemanticColors
Non-semantic color palette for icons.
IconSemanticColors
All semantic icon color variants with labels.
IconShowcase
IconSizes
All icon sizes from extra-small to large.
IconStatusIcons
Status list using semantic icons for success, warning, error, and info.
IconButtonActionBar
Row of ghost icon buttons for a compact action toolbar
IconButtonLoadingToggle
Icon buttons that show a loading spinner on click for async feedback
IconButtonShowcase
An icon button with a wrench icon.
IconButtonTooltipIconButton
Icon buttons with tooltips that explain each action on hover
ItemShowcase
ItemWithMedia
Items with leading avatars and icons in the startContent slot. Keep start content small so the row stays compact and easy to scan.
ItemWithMetadata
Items with end-aligned metadata and badges. Use the endContent slot for counts, status, timestamps, and other secondary row information.
ListItemWithMedia
List items with leading avatars and icons. Use startContent for compact visual identifiers that help users scan the collection.
ListItemWithMetadata
List items with end-aligned metadata. Use endContent for badges, counts, timestamps, and compact status details.
MediaThemeShowcase
A compact media overlay showing MediaTheme adapting text, icons, badges, and button variants over an image-backed dark surface.
MobileNavBasicMobileNav
Mobile navigation drawer with sectioned nav items triggered by a menu button
MobileNavShowcase
MobileNavWithoutTitleMobileNav
Mobile navigation drawer without a title header
MobileNavToggleBasic
A nav toggle with a custom icon and accessible label instead of the default hamburger. It opens a MobileNav drawer via the AppShell mobile context, which AppShell provides automatically.
NavIconBasic
Circular icon containers wrapping semantic icons. Use as logos or accent icons in navigation headers such as TopNavHeading.
NavIconShowcase
Circular icon containers for navigation headers with accent backgrounds.
PaginationDotsCarousel
A review carousel using dot pagination to step through testimonial cards. Use the dots variant for carousels, galleries, and any paged content where the total is small and visible position matters more than a page number.
SectionWashHighlight
A default section stacked with a full-width muted section. Shows how muted draws attention to a specific region like an upgrade prompt or banner.
ToggleButtonColor
Toggle buttons with colored icons in the pressed state. Shows accent-colored toolbar formatting and semantic reaction colors (yellow star, red heart, blue bookmark).
ToggleButtonGroup
Toggle button groups in single-select and multi-select modes. Single selection acts as a view mode switcher; multiple selection forms a formatting toolbar.
ToggleButtonIconSwap
Icon-only toggle buttons that swap between outline and solid icons when pressed. Use for actions like favorite, bookmark, or mute where the icon itself communicates the state.
ToggleButtonLabel
Toggle buttons with visible text labels that show a font weight shift on press. Use when the icon alone is not enough to communicate the action.
ToggleButtonShowcase
ToggleButtonStates
Default, pressed, disabled, and loading states of a standalone toggle button. Shows how visual treatment changes across states.
TokenIcon
Tokens with a leading icon that identifies the entity type. Use when the icon helps users recognize the token category faster, like a user icon for people or a tag icon for labels.
TokenShowcase
ToolbarBulkActions
A compact toolbar with the muted variant for showing bulk selection actions. Use when the user selects multiple items in a list or table and needs quick access to batch operations.
ToolbarCardHeader
A toolbar as a card header with a left-aligned title and icon actions on the right. Use Toolbar instead of LayoutHeader when your card header has interactive actions; Toolbar adds start/end slot layout, keyboard navigation, and automatic size cascading. If the header is just a title with no actions, a LayoutHeader or Section is enough.
ToolbarSizes
Small, medium, and large toolbars side by side. The size prop cascades to child buttons and inputs automatically. Use small in dense UIs like cards, medium for most cases, and large for spacious layouts.
ToolbarThreeSlot
A toolbar with start, center, and end content using the three-column grid layout. Use when you need a centered title or heading with navigation and actions on either side.
ToolbarWithTabs
A toolbar with tabs in the start slot and an action button at the end. Use as a card or section header when content is split into tabs with a primary action alongside.
TopNavShowcase
TopNavHeadingBasic
A product heading with a logo inside a TopNav, linked to the home page. Use as the leading brand element of a top navigation bar.
TreeListFileTreeWithIcons
File browser tree with folder and document icons distinguishing directories from files.
TreeListInteractiveSettings
Settings tree with clickable items and a documentation link.
VisuallyHiddenShowcase
VisuallyHiddenSupplementaryContext
Add screen-reader-only context to terse visual data, like spelling out what a trend arrow means.

---

# StatusDot

A small colored dot that communicates status like online/offline presence or severity levels. Supports five semantic variants and an optional pulse animation. Always pair with a visible text label, as color alone should not carry meaning.

**Import:** `import {StatusDot} from '@astryxdesign/core/StatusDot';`

## Best Practices

- **Do:** Always pair with a visible text label so status is not conveyed by color alone.
- **Do:** Provide a descriptive `label` prop for screen reader accessibility.
- **Don't:** Use the pulse animation for purely decorative purposes; reserve it for states that require immediate attention.
- **Don't:** Rely on color alone to communicate status; always include text.

## Props

| Prop        | Type                                                         | Default | Description                                               |
| ----------- | ------------------------------------------------------------ | ------- | --------------------------------------------------------- |
| `variant`   | `'success' \| 'warning' \| 'error' \| 'accent' \| 'neutral'` | —       | Semantic color variant. **(required)**                    |
| `label`     | `string`                                                     | —       | Accessible label via aria-label. **(required)**           |
| `isPulsing` | `boolean`                                                    | `false` | Pulse animation; respects prefers-reduced-motion: reduce. |
| `tooltip`   | `string`                                                     | —       | Tooltip text on hover to explain status meaning.          |
| `xstyle`    | `StyleXStyles`                                               | —       | StyleX layout styles; must be stylex.create() value.      |

## Theming

| Component class    | Preferred data attributes | Props                                    | States |
| ------------------ | ------------------------- | ---------------------------------------- | ------ |
| `astryx-statusdot` | `data-variant`            | success, warning, error, accent, neutral | —      |

Override in defineTheme:

```ts
components: {
  'statusdot': {
    base: { /* CSS properties */ },
    'variant:value': { /* variant-specific */ },
  },
}
```

Related block templates:

StatusDotPulsing
Animated pulsing dots for live, processing, and error states.
StatusDotShowcase
A positive status dot indicator.
StatusDotStatusIndicators
Labeled status dot list for presence indicators like online, away, and offline.
StatusDotVariants
All five semantic color variants displayed in a row.
TabListTabsWithStatusDot
Tabs with status dot indicators rendered via endContent to show live environment health at a glance.

---

# ProgressBar

A horizontal bar showing the completion progress of a task. Use it for operations where the duration is known, or as an animated indicator when progress can't be calculated. Supports semantic color variants, value labels, and custom formatting.

**Import:** `import {ProgressBar} from '@astryxdesign/core/ProgressBar';`

## Best Practices

- **Do:** Use a determinate bar when the total amount of work is known, and indeterminate when it's not.
- **Do:** Choose a color variant that matches the context: accent for general progress, success for completion, warning or error for alerts.
- **Do:** Always provide a label, even if hidden; screen readers need it to announce what's loading.
- **Don't:** Place icons or labels inside the bar; compose them alongside it using layout components.
- **Don't:** Use a progress bar for instant actions; it's meant for operations that take noticeable time.
- **Don't:** Use multiple progress bars stacked together for the same operation; use one bar with a value label instead.

## Props

| Prop               | Type                                                         | Default    | Description                                                            |
| ------------------ | ------------------------------------------------------------ | ---------- | ---------------------------------------------------------------------- |
| `label`            | `string`                                                     | —          | accessible label **(required)**                                        |
| `value`            | `number`                                                     | `0`        | Current value (ignored when indeterminate).                            |
| `max`              | `number`                                                     | `100`      | Maximum value.                                                         |
| `isLabelHidden`    | `boolean`                                                    | `false`    | Visually hide label (remains accessible).                              |
| `hasValueLabel`    | `boolean`                                                    | `false`    | Show formatted value text (ignored when indeterminate).                |
| `formatValueLabel` | `(value: number, max: number) => string`                     | —          | Custom value label formatter; defaults to percentage string.           |
| `variant`          | `'accent' \| 'success' \| 'warning' \| 'error' \| 'neutral'` | `'accent'` | Semantic color variant.                                                |
| `isIndeterminate`  | `boolean`                                                    | `false`    | Animated loading indicator for unknown progress.                       |
| `isDisabled`       | `boolean`                                                    | `false`    | Visually disabled: grays out fill and text.                            |
| `xstyle`           | `StyleXStyles`                                               | —          | StyleX styles for layout customization. Must be stylex.create() value. |

## Theming

| Component class            | Preferred data attributes | Props                                    | States |
| -------------------------- | ------------------------- | ---------------------------------------- | ------ |
| `astryx-progressbar`       | `data-variant`            | accent, success, warning, error, neutral | —      |
| `astryx-progressbar-fill`  | `data-variant`            | accent, success, warning, error, neutral | —      |
| `astryx-progressbar-track` | —                         | —                                        | —      |

Override in defineTheme:

```ts
components: {
  'progressbar': {
    base: { /* CSS properties */ },
    'variant:value': { /* variant-specific */ },
  },
  'progressbar-fill': {
    base: { /* CSS properties */ },
  },
}
```

Related block templates:

ChatComposerFullFeatured
Chat composer with all slots populated: collapsible attachment drawer, header actions, context progress bar, footer dropdown menus, and mic button. Shows the maximum composer configuration.
ChatComposerDrawerWithProgress
Drawer paired with a context progress bar in the header. Show context window usage when attachments consume part of the available token budget.
ProgressBarCustomFormat
Progress bar with a custom value label showing disk usage in GB.
ProgressBarIndeterminate
Indeterminate progress bar for operations with unknown duration.
ProgressBarSemanticVariants
All semantic color variants stacked vertically.
ProgressBarShowcase
A progress bar filled to 60%.
ProgressBarWithValueLabel
Progress bar with its current percentage displayed.

---

# Markdown

Renders a markdown string as Astryx-styled components. Use Markdown for user-generated content, AI responses, and documentation; it handles headings, lists, tables, code blocks, and citations with consistent styling.

**Import:** `import {Markdown} from '@astryxdesign/core/Markdown';`

## Best Practices

- **Do:** Set headingLevelStart to match the page hierarchy, e.g. start at 3 if the markdown sits inside an h2 section.
- **Do:** Use contentWidth to keep prose at a readable line length in wide layouts.
- **Do:** Use inlinePlugins for custom shorthand patterns (issue refs, diff refs, mentions) instead of preprocessing the markdown string.
- **Don't:** Use Markdown for hand-authored layouts; use Text and Heading directly when you control the content.

## Props

| Prop                | Type                                                 | Default     | Description                                                                                                                                          |
| ------------------- | ---------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `children`          | `string`                                             | —           | markdown string **(required)**                                                                                                                       |
| `display`           | `'block' \| 'inline'`                                | `'block'`   | Display type. Markdown defaults to block. Use 'inline' for markdown spans embedded inside text.                                                      |
| `density`           | `'default' \| 'compact'`                             | `'default'` | Block spacing. 'default'\|'compact'. Default: 'default'.                                                                                             |
| `headingLevelStart` | `1 \| 2 \| 3 \| 4 \| 5 \| 6`                         | `1`         | Maps # to this heading level (1-6). Clamped to h6. Default: 1.                                                                                       |
| `isStreaming`       | `boolean`                                            | `false`     | Incremental parse + fade-in for streamed chunks. Default: false.                                                                                     |
| `onLinkClick`       | `(href: string, event: MouseEvent) => void \| false` | —           | (href, event) => void\|false. Return false prevents navigation.                                                                                      |
| `sources`           | `Record<string, MarkdownSource>`                     | —           | Record<string, MarkdownSource>. Citation sources by ID. [id]/【id】 markers render as chips.                                                         |
| `citationStyle`     | `'label' \| 'number'`                                | `'label'`   | 'label'\|'number'. label=chip w/ title+icon, number=compact badge. Default: 'label'.                                                                 |
| `contentWidth`      | `number \| string`                                   | `680`       | number\|string. Max width for prose (headings, paragraphs, lists). Tables/code unconstrained.                                                        |
| `contentAlign`      | `'start' \| 'center'`                                | `'start'`   | 'start'\|'center'. Prose alignment when contentWidth < container. Default: 'start'.                                                                  |
| `inlinePlugins`     | `MarkdownInlinePlugin[]`                             | —           | MarkdownInlinePlugin[]. Regex matches in text nodes -> custom inline React elements. Skips inline/fenced code.                                       |
| `autolink`          | `'gfm'`                                              | —           | 'gfm'. Opt-in GFM autolinking: bare URLs (https?://, www.), <scheme:url>, <email>, user@host. Skips code, code blocks, existing links. Default: off. |
| `xstyle`            | `StyleXStyles`                                       | —           | stylex.create() for layout (margins, sizing).                                                                                                        |
| `className`         | `string`                                             | —           | CSS class. Prefer xstyle.                                                                                                                            |
| `style`             | `CSSProperties`                                      | —           | Inline styles. Prefer xstyle.                                                                                                                        |
| `data-testid`       | `string`                                             | —           | Test selector.                                                                                                                                       |

## Examples

### Inline display

```tsx
import { Text } from '@astryxdesign/core/Text';

<Text>
  This description includes{' '}
  <Markdown display="inline">{'`inline code` and **bold text**'}</Markdown>.
</Text>;
```

### GFM autolinks

```tsx
<Markdown autolink="gfm">
  {'Visit https://example.com or email contact@example.com. ' +
    'You can also bracket links: <https://docs.example.com>.'}
</Markdown>
```

### Inline Plugins

```tsx
import { Link } from '@astryxdesign/core/Link';

const issuePlugins = [
  {
    pattern: /\b([A-Z][A-Z0-9]+-\d+)\b/g,
    render: (match, key) => (
      <Link key={key} href={`/issues/${match[1]}`}>
        {match[0]}
      </Link>
    ),
  },
];

<Markdown inlinePlugins={issuePlugins}>
  {'Fixed PROJ-123. Inline code stays plain: `PROJ-999`.'}
</Markdown>;
```

## Theming

| Component class   | Preferred data attributes | Props   | States |
| ----------------- | ------------------------- | ------- | ------ |
| `astryx-markdown` | `data-density`            | density | —      |

Override in defineTheme:

```ts
components: {
  'markdown': {
    base: { /* CSS properties */ },
    'density:value': { /* variant-specific */ },
  },
}
```

Related block templates:

ChatLayoutPanelChat
Narrow sidebar chat in a constrained container that triggers compact density. Use for side panels, drawers, or embedded chat widgets where horizontal space is limited.
ChatMessageListFullFeatured
Conversation showcasing system messages, multi-bubble grouping, markdown, code blocks, and metadata. Combines date dividers, ghost bubbles, grouped messages, and rich content in a single example.
MarkdownCitedContent
Markdown with citation chips linked to external sources
MarkdownCompactAIResponse
Compact markdown styled for AI responses with shifted heading levels
MarkdownDataTable
Comparison table rendered from a markdown string
MarkdownRichContent
Markdown with headings, lists, code blocks, tables, blockquotes, and task lists
MarkdownShowcase
Rich markdown content with headings, lists, and formatting.

---

# CodeBlock

CodeBlock renders syntax-highlighted code with line numbers, a copy button, and optional collapsible sections. Use CodeBlock for multi-line snippets like source files, terminal commands, and configuration examples. Use Code for inline references to function names, variables, or CLI flags within body text.

**Import:** `import {CodeBlock} from '@astryxdesign/core/CodeBlock';`

## Anatomy

| Element           | Required | Description                                                                                |
| ----------------- | -------- | ------------------------------------------------------------------------------------------ |
| Header Bar        | No       | Shows the title, language label, and copy button. Appears when any of these props are set. |
| Line Numbers      | No       | Numbered gutter along the left edge. Enable with hasLineNumbers.                           |
| Code Body         | Yes      | The syntax-highlighted code content.                                                       |
| Highlighted Lines | No       | Background accent on specific lines to draw attention.                                     |
| Copy Button       | No       | Copies the code string to the clipboard. Shown by default.                                 |

## Best Practices

- **Do:** Set the language prop to match the code content so syntax highlighting is accurate. Use "plaintext" when the language is unknown.
- **Do:** Add a title when the code represents a file. It gives readers context and appears in the header bar alongside the copy button.
- **Do:** Use Code for short inline references like function names or CLI flags, and CodeBlock for standalone multi-line snippets.
- **Don't:** Enable line numbers on short snippets (under 5 lines) where they add clutter without helping navigation.
- **Don't:** Nest a code block inside a scrollable container. Use the maxHeight prop instead, which handles overflow natively.

## Props

| Prop                   | Type                                                                                    | Default         | Description                                                                                                                                                                                                                                                                          |
| ---------------------- | --------------------------------------------------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `code`                 | `string`                                                                                | —               | The code string to display. **(required)**                                                                                                                                                                                                                                           |
| `language`             | `string`                                                                                | `'plaintext'`   | Language for syntax highlighting. Use "plaintext" to disable.                                                                                                                                                                                                                        |
| `title`                | `string`                                                                                | —               | Filename or label shown in the header bar.                                                                                                                                                                                                                                           |
| `hasLanguageLabel`     | `boolean`                                                                               | `true`          | Show the language name in the header bar. Hidden when language is "plaintext".                                                                                                                                                                                                       |
| `hasLineNumbers`       | `boolean`                                                                               | `false`         | Show a line number gutter.                                                                                                                                                                                                                                                           |
| `highlightLines`       | `number[]`                                                                              | —               | 1-indexed line numbers to highlight.                                                                                                                                                                                                                                                 |
| `hasCopyButton`        | `boolean`                                                                               | `true`          | Show a copy-to-clipboard button.                                                                                                                                                                                                                                                     |
| `onCopy`               | `() => void`                                                                            | —               | Callback after the code is copied.                                                                                                                                                                                                                                                   |
| `isWrapped`            | `boolean`                                                                               | `false`         | Wrap long lines instead of enabling horizontal scroll.                                                                                                                                                                                                                               |
| `maxHeight`            | `number \| string`                                                                      | —               | Max height before the block scrolls vertically.                                                                                                                                                                                                                                      |
| `size`                 | `'sm' \| 'md'`                                                                          | `'md'`          | Text size variant.                                                                                                                                                                                                                                                                   |
| `width`                | `string`                                                                                | `'fit-content'` | Width of the code block. Any CSS width value. 'fit-content' (default) shrinks to longest line. '100%' fills parent width.                                                                                                                                                            |
| `container`            | `'card' \| 'section'`                                                                   | `'card'`        | Container presentation style. 'card' (default): border and radius with the muted syntax background for a standalone card look. 'section': no border or radius and a transparent background so the block blends into the card or panel it's embedded in.                              |
| `tokenizer`            | `(code: string, language: string) => Array<{type: string; start: number; end: number}>` | —               | Custom tokenizer override for unsupported languages.                                                                                                                                                                                                                                 |
| `syntaxTheme`          | `SyntaxThemeDefinition`                                                                 | —               | Per-instance syntax theme override. Shorthand for wrapping the block in <SyntaxTheme theme={...}>. Accepts a preset from @astryxdesign/core/theme/syntax or a theme created with defineSyntaxTheme(). Defaults to the nearest SyntaxTheme ancestor or the theme-level syntax colors. |
| `isCollapsible`        | `boolean`                                                                               | `false`         | Allow collapsing the code body into just the header bar. Starts expanded; the header becomes clickable to toggle. Only shows the toggle when the code exceeds collapsibleThreshold lines.                                                                                            |
| `collapsibleThreshold` | `number`                                                                                | `10`            | Minimum number of lines before the collapse toggle appears. Below this threshold the code block renders normally even when isCollapsible is true.                                                                                                                                    |
| `xstyle`               | `StyleXStyles`                                                                          | —               | StyleX styles for layout customization. Must be a stylex.create() value.                                                                                                                                                                                                             |
| `className`            | `string`                                                                                | —               | CSS class name for the root element. Prefer xstyle for styling.                                                                                                                                                                                                                      |
| `style`                | `CSSProperties`                                                                         | —               | Inline styles. Prefer xstyle for StyleX-optimized styling.                                                                                                                                                                                                                           |
| `data-testid`          | `string`                                                                                | —               | Test selector for automated testing frameworks.                                                                                                                                                                                                                                      |

## Components

### Code

See `npx astryx component Code` for props and usage.

## Theming

| Component class    | Preferred data attributes                      | Props                     | States |
| ------------------ | ---------------------------------------------- | ------------------------- | ------ |
| `astryx-code`      | `data-color`                                   | color                     | —      |
| `astryx-codeblock` | `data-size`, `data-language`, `data-container` | size, language, container | —      |

Override in defineTheme:

```ts
components: {
  'code': {
    base: { /* CSS properties */ },
    'color:value': { /* variant-specific */ },
  },
  'codeblock': {
    base: { /* CSS properties */ },
  },
}
```

Related block templates:

ChatMessageListFullFeatured
Conversation showcasing system messages, multi-bubble grouping, markdown, code blocks, and metadata. Combines date dividers, ghost bubbles, grouped messages, and rich content in a single example.
ChatToolCallsInteractiveToolCalls
Tool calls with expandable result details showing diffs and command output in code blocks. Click a row to reveal its result.
CodeBlockBashCommand
Short terminal commands with a copy button and no line numbers. Use for install instructions or one-liner commands that readers will paste directly.
CodeBlockHighlightedLines
TypeScript code with specific lines highlighted to draw attention to a key section. Use highlightLines to call out new or important code in tutorials and changelogs.
CodeBlockJSONConfig
A JSON configuration file with a title bar and line numbers. The title prop adds a filename label in the header so readers know which file the code belongs to.
CodeBlockScrollableBlock
A long code block with a max height that enables vertical scrolling. Use maxHeight to keep the block from dominating the page when displaying large files.
CodeBlockShowcase
A syntax-highlighted TypeScript code block with line numbers, a title bar, and a copy button.
CodeBlockTerminal
A dark terminal-style command block: a bash CodeBlock wrapped in SyntaxTheme with the GitHub Dark preset, copy button on, and no line numbers. Use for shell sessions or CLI output that should read as a terminal even on light pages. Reach for a dark syntax preset instead of hand-rolling a dark box with custom CSS.
SyntaxThemeDarkPreset
Wrap a code block in SyntaxTheme to apply a dark syntax preset such as Dracula.
SyntaxThemeLightPreset
Use a light syntax preset for code examples that need to sit on light documentation surfaces.
SyntaxThemeShowcase
A concise code block rendered with the One Dark Pro syntax preset to show how SyntaxTheme changes highlighting colors without making the page long.

---

# Pagination

Pagination lets users step through pages of content. Place it below a table, list, or card grid so users can move forward and backward through results. Pick a variant to match the context: numbered pages for data tables, a count for large lists, compact for tight spaces, or dots for carousels.

**Import:** `import {Pagination} from '@astryxdesign/core/Pagination';`

## Best Practices

- **Do:** Place pagination below the content it controls so users see results before navigating.
- **Do:** Use the pages variant for data tables where users need to jump to a specific page.
- **Do:** Use the count variant with a page size selector when users need to control how many items they see at once.
- **Do:** Use the dots variant for carousels and walkthroughs where the total is small and position matters more than a number.
- **Do:** Pass totalItems when the total is known so users can see how much content remains.
- **Don't:** Show pagination when all items fit on a single page; there is nothing to paginate.
- **Don't:** Use the dots variant for more than about 10 pages; the dots become too small to be useful.
- **Don't:** Place pagination above the content; users expect it at the bottom.

## Props

| Prop               | Type                                                  | Default        | Description                                                                                           |
| ------------------ | ----------------------------------------------------- | -------------- | ----------------------------------------------------------------------------------------------------- |
| `page`             | `number`                                              | —              | Current page number (1-based). **(required)**                                                         |
| `onChange`         | `(page: number) => void`                              | —              | Called on page change. **(required)**                                                                 |
| `changeAction`     | `(page: number) => void \| Promise<void>`             | —              | Async action on page change. Fires after onChange; uses React transitions for loading.                |
| `totalItems`       | `number`                                              | —              | Total items. Calculates page count. Precedence over totalPages.                                       |
| `totalPages`       | `number`                                              | —              | Total pages. Use when page count known but not item count.                                            |
| `hasMore`          | `boolean`                                             | —              | More pages exist after current. For cursor-based pagination.                                          |
| `pageSize`         | `number`                                              | `10`           | Items per page; coerced to positive integer, non-finite falls back to default                         |
| `pageSizeOptions`  | `number[]`                                            | —              | Page size options. Shows selector dropdown when provided.                                             |
| `onPageSizeChange` | `(pageSize: number) => void`                          | —              | Called on page size change. Auto resets to page 1.                                                    |
| `variant`          | `'pages' \| 'count' \| 'compact' \| 'dots' \| 'none'` | `'pages'`      | Display between prev/next buttons.                                                                    |
| `siblingCount`     | `number`                                              | `1`            | Page buttons each side of current; only variant='pages'.                                              |
| `size`             | `'sm' \| 'md'`                                        | `'md'`         | Control size.                                                                                         |
| `isDisabled`       | `boolean`                                             | `false`        | Component disabled.                                                                                   |
| `label`            | `string`                                              | `'Pagination'` | Accessible label for nav landmark.                                                                    |
| `xstyle`           | `StyleXStyles`                                        | —              | StyleX styles for layout customization (margins, positioning, sizing). Must be stylex.create() value. |

## Theming

| Component class         | Preferred data attributes   | Props                             | States |
| ----------------------- | --------------------------- | --------------------------------- | ------ |
| `astryx-pagination`     | `data-size`, `data-variant` | pages, count, compact, dots, none | —      |
| `astryx-pagination-dot` | `data-size`, `data-active`  | size                              | active |

Override in defineTheme:

```ts
components: {
  'pagination': {
    base: { /* CSS properties */ },
    'size:value': { /* variant-specific */ },
  },
  'pagination-dot': {
    base: { /* CSS properties */ },
    'active': { /* state-specific */ },
  },
}
```

Related block templates:

PaginationDotsCarousel
A review carousel using dot pagination to step through testimonial cards. Use the dots variant for carousels, galleries, and any paged content where the total is small and visible position matters more than a page number.
PaginationPageSize
A transactions table with pagination and a page size dropdown at the bottom. Shows how pagination works as a footer below real content, with adjustable rows per page.
PaginationVariants
All four display variants stacked: dots, compact, count, and pages. A quick visual reference for choosing the right variant.
PaginationWithTable
Pagination below a data table with client-side page slicing. Use the count variant with small size for dense data views where users need to see item ranges.

---

# SegmentedControl

A segmented button group that allows users to make a single selection from a small set of mutually exclusive options. Use SegmentedControl when all options should be visible at once and the selection controls a value or mode, not page navigation.

**Import:** `import {SegmentedControl} from '@astryxdesign/core/SegmentedControl';`

## Best Practices

- **Do:** Use for switching between 2–5 mutually exclusive views or modes where all options should be visible.
- **Do:** Provide a descriptive label for the control to ensure the group is accessible to screen readers.
- **Don't:** Use for page-level navigation; use TabList instead. TabList is a navigation component, while SegmentedControl is an input that always has exactly one selected option.
- **Don't:** Use for simple on/off states; use ToggleButton instead. ToggleButton can be toggled on or off independently, while SegmentedControl enforces a single selection from a group.
- **Don't:** Wrap a disabled SegmentedControl in Tooltip to explain why it is disabled; disabled controls swallow the hover events the wrapper needs. Use the disabledMessage prop instead.

## Props

| Prop              | Type                      | Default | Description                                                                                                                                                                                                                                                                                                                                                                                     |
| ----------------- | ------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `value`           | `string`                  | —       | currently selected value (controlled) **(required)**                                                                                                                                                                                                                                                                                                                                            |
| `onChange`        | `(value: string) => void` | —       | callback on segment selection **(required)**                                                                                                                                                                                                                                                                                                                                                    |
| `label`           | `string`                  | —       | aria-label for radio group (never rendered) **(required)**                                                                                                                                                                                                                                                                                                                                      |
| `size`            | `'sm' \| 'md' \| 'lg'`    | `'md'`  | size variant                                                                                                                                                                                                                                                                                                                                                                                    |
| `layout`          | `'hug' \| 'fill'`         | `'hug'` | hug (default) sizes to content; fill stretches equally                                                                                                                                                                                                                                                                                                                                          |
| `isDisabled`      | `boolean`                 | `false` | disables entire control                                                                                                                                                                                                                                                                                                                                                                         |
| `disabledMessage` | `string`                  | —       | Explains why the control is disabled. Applies to the whole-group disabled state (isDisabled), not per segment. With isDisabled, shows a tooltip on hover/keyboard focus and keeps the control focusable via aria-disabled (selection stays blocked). Use this instead of wrapping a disabled SegmentedControl in Tooltip. Disabled controls swallow the hover events an external Tooltip needs. |
| `children`        | `ReactNode`               | —       | SegmentedControlItem children **(required)**                                                                                                                                                                                                                                                                                                                                                    |
| `xstyle`          | `StyleXStyles`            | —       | additional StyleX styles for container                                                                                                                                                                                                                                                                                                                                                          |

## Components

### SegmentedControlItem

See `npx astryx component SegmentedControlItem` for props and usage.

## Theming

| Component class                 | Preferred data attributes                     | Props | States             |
| ------------------------------- | --------------------------------------------- | ----- | ------------------ |
| `astryx-segmented-control`      | `data-size`                                   | size  | —                  |
| `astryx-segmented-control-item` | `data-size`, `data-selected`, `data-disabled` | size  | selected, disabled |

Override in defineTheme:

```ts
components: {
  'segmented-control': {
    base: { /* CSS properties */ },
    'size:value': { /* variant-specific */ },
  },
  'segmented-control-item': {
    base: { /* CSS properties */ },
    'selected': { /* state-specific */ },
  },
}
```

Some properties are set via standard CSS in component overrides:

```ts
components: {
  segmented-control: {
    base: {
      borderRadius: '...',
      padding: '...',
    },
  },
}
```

Related block templates:

SegmentedControlDisabledItem
Segmented control with an individually disabled option for unavailable choices.
SegmentedControlFillLayout
Segmented control that stretches segments equally to fill the available width, useful for fixed-width containers.
SegmentedControlIconOnly
Compact segmented control with hidden labels, showing only icons for space-constrained layouts.
SegmentedControlShowcase
SegmentedControlWithIcons
Segmented control with icon and label pairs for a view mode switcher.
SegmentedControlItemBasic
Label-only options inside a SegmentedControl. Each item declares a value; the parent control holds the selected value and change handler.
SegmentedControlItemShowcase
Segmented control items with text labels and icons, including a disabled item.

---

# Toolbar

Horizontal bar w/ left, optional center, right. For contextual actions within content (tables, cards, panels), not page-level headers. Size cascades to children.

**Import:** `import {Toolbar} from '@astryxdesign/core/Toolbar';`

## Best Practices

- **Do:** Secondary actions (Back) left, primary actions (Save) right.
- **Do:** Make temporary toolbars (bulk selection) visually distinct, e.g. background color or border.
- **Do:** Separate toolbar from content: divider, background variant, or both.
- **Do:** Use Toolbar as card header when it has actions (filter, add). Just a title? Use LayoutHeader/Section.
- **Don't:** Overload with actions; use MoreMenu for overflow.
- **Don't:** Set size on child buttons; set once on toolbar, it cascades.
- **Don't:** Use for app-wide nav (menu links, sign out); use TopNav/LayoutHeader.

## Components

### Toolbar

Toolbar container w/ 3 content slots + roving tabindex.

| Prop            | Type                                                       | Default         | Description                                                               |
| --------------- | ---------------------------------------------------------- | --------------- | ------------------------------------------------------------------------- |
| `label`         | `string`                                                   | —               | A11y label, aria-label on toolbar. **(required)**                         |
| `startContent`  | `ReactNode`                                                | —               | Start-aligned content.                                                    |
| `centerContent` | `ReactNode`                                                | —               | Centered content; switches to 3-col grid.                                 |
| `endContent`    | `ReactNode`                                                | —               | End-aligned content.                                                      |
| `size`          | `'sm' \| 'md' \| 'lg'`                                     | `'md'`          | Toolbar size; controls min-height + cascades to children via SizeContext. |
| `gap`           | `0 \| 0.5 \| 1 \| 1.5 \| 2 \| 3 \| 4 \| 5 \| 6 \| 8 \| 10` | `1`             | Gap between slot items.                                                   |
| `orientation`   | `'horizontal' \| 'vertical'`                               | `'horizontal'`  | Keyboard nav direction.                                                   |
| `variant`       | `SectionVariant`                                           | `'transparent'` | Visual variant for Section.                                               |
| `xstyle`        | `StyleXStyles`                                             | —               | StyleX layout styles. Must be stylex.create() value.                      |

## Theming

| Component class  | Preferred data attributes | Props | States |
| ---------------- | ------------------------- | ----- | ------ |
| `astryx-toolbar` | `data-size`               | —     | size   |

Override in defineTheme:

```ts
components: {
  'toolbar': {
    base: { /* CSS properties */ },
    'size': { /* state-specific */ },
  },
}
```

Related block templates:

useKeyboardHintHookUsage
Toolbar shows an ephemeral "← → to navigate" hint on first keyboard focus via useKeyboardHint, teaching sighted keyboard users that arrows move within the group.
TableColumnSettingsTable
Table with a column visibility picker in the toolbar. Toggle columns on and off.
ToolbarBulkActions
A compact toolbar with the muted variant for showing bulk selection actions. Use when the user selects multiple items in a list or table and needs quick access to batch operations.
ToolbarCardHeader
A toolbar as a card header with a left-aligned title and icon actions on the right. Use Toolbar instead of LayoutHeader when your card header has interactive actions; Toolbar adds start/end slot layout, keyboard navigation, and automatic size cascading. If the header is just a title with no actions, a LayoutHeader or Section is enough.
ToolbarSizes
Small, medium, and large toolbars side by side. The size prop cascades to child buttons and inputs automatically. Use small in dense UIs like cards, medium for most cases, and large for spacious layouts.
ToolbarTableFilter
A compact toolbar with a search input, Status and Priority filter selectors, and an overflow menu. Use above a data table to let users search, filter, and access view options.
ToolbarThreeSlot
A toolbar with start, center, and end content using the three-column grid layout. Use when you need a centered title or heading with navigation and actions on either side.
ToolbarWithTabs
A toolbar with tabs in the start slot and an action button at the end. Use as a card or section header when content is split into tabs with a primary action alongside.

---

# MoreMenu

MoreMenu is a three-dot button that opens a list of actions. Use it for secondary actions that don't need to be always visible, like in table rows, card headers, or toolbars.

**Import:** `import {MoreMenu} from '@astryxdesign/core/MoreMenu';`

## Best Practices

- **Do:** Use for overflow or secondary actions; keep primary actions visible outside the menu.
- **Do:** Use dividers or sections to group related actions when the menu has many items.
- **Don't:** Hide primary actions inside a MoreMenu; they should be directly visible.

## Props

| Prop         | Type                   | Default          | Description                                                                                           |
| ------------ | ---------------------- | ---------------- | ----------------------------------------------------------------------------------------------------- |
| `items`      | `DropdownMenuOption[]` | —                | Menu items (actions, dividers, sections). Same type as DropdownMenu items. **(required)**             |
| `label`      | `string`               | `'More options'` | Accessible label (aria-label) + tooltip text.                                                         |
| `variant`    | `ButtonVariant`        | `'ghost'`        | Trigger button visual style variant.                                                                  |
| `size`       | `ButtonSize`           | `'md'`           | Trigger button size.                                                                                  |
| `icon`       | `ReactNode`            | —                | Override default three-dot icon. Accepts any ReactNode.                                               |
| `isDisabled` | `boolean`              | `false`          | Whether menu trigger disabled.                                                                        |
| `xstyle`     | `StyleXStyles`         | —                | StyleX styles for layout customization (margins, positioning, sizing). Must be stylex.create() value. |

## Theming

| Component class    | Preferred data attributes | Props | States |
| ------------------ | ------------------------- | ----- | ------ |
| `astryx-more-menu` | —                         | —     | —      |

Override in defineTheme:

```ts
components: {
  'more-menu': {
    base: { /* CSS properties */ },
  },
}
```

Related block templates:

MoreMenuDefaultMoreMenu
Basic three-dot overflow menu with simple text-only action items.
MoreMenuShowcase
A basic three-dot menu with simple action items.
MoreMenuWithDividers
A three-dot menu with a divider separating destructive actions from safe ones.
MoreMenuWithSections
A three-dot menu with actions organized into labeled groups.
SideNavEndContent
Side navigation items with badges, counts, and context menus as trailing content.
ToolbarTableFilter
A compact toolbar with a search input, Status and Priority filter selectors, and an overflow menu. Use above a data table to let users search, filter, and access view options.

---

# Avatar

Avatar represents a person or team with a profile photo, initials, or a default icon. Falls back automatically. Use in comment headers, contact lists, chat, user cards.

**Import:** `import {Avatar} from '@astryxdesign/core/Avatar';`

## Anatomy

| Element      | Required | Description                                                                             |
| ------------ | -------- | --------------------------------------------------------------------------------------- |
| Photo        | No       | The profile image, loaded from the src URL. Shown when available.                       |
| Initials     | No       | One or two letters extracted from the name. Shown when no photo is available.           |
| Default icon | No       | A generic person silhouette. Shown when there is no photo or name.                      |
| Status dot   | No       | A small indicator in the bottom-right corner showing availability (online, away, busy). |

## Best Practices

- **Do:** Always pass a name for initials fallback and screen reader alt text.
- **Do:** Match size to context: xsm/sm inline, md/lg in lists, xl for profiles.
- **Do:** Add a status dot in chat or team views where availability matters.
- **Don't:** Use for logos or product images. Use an image or icon instead.
- **Don't:** Force a square or custom shape. Avatars are always circular.

## Props

| Prop          | Type                                              | Default | Description                                                                                 |
| ------------- | ------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------- |
| `src`         | `string`                                          | —       | primary image source URL                                                                    |
| `fallbackSrc` | `string`                                          | —       | fallback image when primary fails                                                           |
| `name`        | `string`                                          | —       | user name for initials and alt text                                                         |
| `alt`         | `string`                                          | —       | alt text; falls back to name                                                                |
| `size`        | `'xsm' \| 'sm' \| 'md' \| 'lg' \| 'xl' \| number` | `'md'`  | avatar size. Named ('xsm' 20px, 'sm' 24px, 'md' 36px, 'lg' 48px, 'xl' 128px) or numeric px. |
| `status`      | `ReactNode`                                       | —       | corner content for status indicators                                                        |

## Components

### AvatarStatusDot

size-aware status indicator rendered in the Avatar corner

See `npx astryx component AvatarStatusDot` for props and usage.

## Theming

| Component class            | Preferred data attributes | Props   | States |
| -------------------------- | ------------------------- | ------- | ------ |
| `astryx-avatar`            | `data-size`               | size    | —      |
| `astryx-avatar-status-dot` | `data-variant`            | variant | —      |

Override in defineTheme:

```ts
components: {
  'avatar': {
    base: { /* CSS properties */ },
    'size:value': { /* variant-specific */ },
  },
  'avatar-status-dot': {
    base: { /* CSS properties */ },
  },
}
```

Related block templates:

AvatarFallbackChain
Demonstrates the avatar fallback chain: primary image, fallback image, initials, then default icon.
AvatarGroup
Overlap multiple avatars in a row to represent a group of people. Use for team lists, PR reviewers, or participant counts where you want to show faces without taking up much space.
AvatarInitialsFallback
Show initials instead of a photo. The avatar extracts the first and last initials from the name automatically. Use when you only have a user name, like in anonymous accounts or new user onboarding.
AvatarShowcase
Avatars at every size with an image, initials fallback, and a status dot. A quick visual reference for choosing the right size.
AvatarUserCard
Place an avatar next to a name and role to create a user card row. Use for comment headers, contact lists, profile sections, or anywhere you need to identify a person at a glance.
AvatarWithImage
Show a profile photo at different sizes. Use when you have a user photo URL. If the image fails to load, initials are shown instead.
AvatarWithStatus
Add a status dot to an avatar to show whether someone is online, away, or busy. Use in chat, messaging, or any UI where knowing availability matters.
AvatarGroupShowcase
Overlapping avatar rows with max limit and server-side overflow count. Shows team members in a compact facepile layout.
AvatarGroupOverflowCustomText
Provide short custom children such as 12+ when the overflow count needs compact product-specific formatting.
AvatarGroupOverflowDefault
Use AvatarGroupOverflow without children to render the standard +N overflow count.
AvatarGroupOverflowShowcase
Overflow indicators for hidden avatars, including the default +N label and custom count text.
AvatarStatusDotShowcase
AvatarStatusDot renders a presence indicator on an Avatar, with variants for positive, neutral, and negative states. The dot size automatically coordinates with the Avatar size.
AvatarStatusDotVariants
Presence dots on Avatars using the success, neutral, and error variants. Pass an AvatarStatusDot to the Avatar status prop; the dot sizes itself to match the Avatar.
CarouselSnap
Scroll-snap carousel with navigation buttons and team member cards. Each card snaps to the start edge on scroll. Use when items should be viewed one at a time rather than as a continuous strip.
ChatMessageAvatarName
Messages with avatars and sender names. Place the name on the bubble when using bubbles, or on the message wrapper for raw content.
ChatMessageMultiBubble
Grouped bubbles using the group prop for corner radius reduction. Use first, middle, and last to visually connect related bubbles from the same sender.
ChatMessageShowcase
A user multi-bubble group with delivery status and an assistant ghost response with avatar, name, timestamp, and model info.
ChatMessageBubbleGrouping
Multi-bubble messages using first, middle, and last group positions. Grouped bubbles tighten corner radius on the sender side for a continuous visual flow.
ChatMessageBubbleMetadata
Bubbles with name and metadata slots aligned to bubble padding. Put name on the first bubble and metadata on the last bubble in a message.
ChatMessageListDensity
Side-by-side comparison of compact, balanced, and spacious densities. Use compact in sidebars or panels, balanced for most full-page chat, and spacious for long-form reading. Use gap when row spacing needs to differ from density.
ChatMessageListFullFeatured
Conversation showcasing system messages, multi-bubble grouping, markdown, code blocks, and metadata. Combines date dividers, ghost bubbles, grouped messages, and rich content in a single example.
HoverCardShowcase
A hover card that shows a user profile preview when hovering over a trigger button. Starts open for preview.
ItemShowcase
ItemWithMedia
Items with leading avatars and icons in the startContent slot. Keep start content small so the row stays compact and easy to scan.
ListMessageList
Chat-style message list with avatars, preview text, and unread badges.
ListItemWithMedia
List items with leading avatars and icons. Use startContent for compact visual identifiers that help users scan the collection.
PaginationDotsCarousel
A review carousel using dot pagination to step through testimonial cards. Use the dots variant for carousels, galleries, and any paged content where the total is small and visible position matters more than a page number.
StackFillItem
An avatar, text, and button in a row; the text stretches to fill the available space.

---

# Kbd

Renders a keyboard shortcut as styled key badges. Use Kbd in tooltips, menus, and help text to show key combinations.

**Import:** `import {Kbd} from '@astryxdesign/core/Kbd';`

## Best Practices

- **Do:** Place shortcuts near the action they trigger: in a tooltip, menu item, or inline instruction.
- **Do:** Use mod instead of ctrl or cmd; it automatically adapts to the user's platform.
- **Don't:** Use Kbd as the only way to discover an action; shortcuts should supplement visible controls, not replace them.

## Props

| Prop        | Type            | Default | Description                                                                                                                                            |
| ----------- | --------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `keys`      | `string`        | —       | Shortcut string. "+" separates keys. Special: mod (Cmd on Mac), ctrl, alt, shift, enter, backspace, escape, tab, up, down, left, right. **(required)** |
| `xstyle`    | `StyleXStyles`  | —       | StyleX styles for layout customization. Must be stylex.create() value.                                                                                 |
| `className` | `string`        | —       | CSS class for root element. Prefer xstyle; className for non-StyleX integration.                                                                       |
| `style`     | `CSSProperties` | —       | Inline styles for root element. Prefer xstyle; inline styles bypass StyleX optimization.                                                               |

## Theming

| Component class | Preferred data attributes | Props | States |
| --------------- | ------------------------- | ----- | ------ |
| `astryx-kbd`    | —                         | —     | —      |

Override in defineTheme:

```ts
components: {
  'kbd': {
    base: { /* CSS properties */ },
  },
}
```

Related block templates:

CommandPaletteRichItems
Custom item rendering with icons, keyboard shortcuts, and keyword search.
CommandPaletteInputBasic
Custom placeholder and a keyboard shortcut badge in the trailing slot via endContent.
CommandPaletteInputShowcase
Command palette search input with a custom placeholder and a keyboard shortcut hint in the endContent slot.
CommandPaletteItemShowcase
Command palette items with custom content via renderItem and as composed CommandPaletteItem with icons, highlighted, selected, and disabled states.
KbdInlineInstructions
Keyboard shortcuts rendered inline within instructional text
KbdMenuShortcuts
Menu-style list pairing action labels with their keyboard shortcuts
KbdModifierCombos
Modifier combinations and special keys rendered as shortcut badges
KbdShowcase

---

# Timestamp

Timestamp formats a date or time into readable text. Use for creation dates, update times, or schedules; relative for recency, absolute for precision, auto to switch automatically.

**Import:** `import {Timestamp} from '@astryxdesign/core/Timestamp';`

## Anatomy

| Element        | Required | Description                                                                        |
| -------------- | -------- | ---------------------------------------------------------------------------------- |
| Formatted text | Yes      | The rendered date, time, or relative label like "2 hours ago" or "Mar 21, 2025".   |
| Tooltip        | No       | A hover card showing the full absolute date and time when the display is relative. |

## Best Practices

- **Do:** Auto format in feeds and lists; recent shows relative, older shows date_time.
- **Do:** Consistent formatting within the same list or table column.
- **Do:** isTimezoneShown for multi-timezone audiences.
- **Do:** isLive for dashboards so relative time stays current.
- **Don't:** Don't show raw Unix timestamps or ISO strings; always use Timestamp.
- **Don't:** Avoid system\_\* formats in user-facing UI; those are for dev tools and logs.
- **Don't:** Don't disable tooltip on relative timestamps; users expect the full date on hover.

## Props

| Prop              | Type                                                                                                               | Default        | Description                                                                                                     |
| ----------------- | ------------------------------------------------------------------------------------------------------------------ | -------------- | --------------------------------------------------------------------------------------------------------------- |
| `value`           | `string \| number`                                                                                                 | —              | date/time as unix seconds or ISO string **(required)**                                                          |
| `format`          | `'relative' \| 'auto' \| 'date' \| 'date_time' \| 'time' \| 'system_date' \| 'system_date_time' \| 'system_time'`  | `'auto'`       | display mode: 'relative', 'auto', 'date', 'date_time', 'time', 'system_date', 'system_date_time', 'system_time' |
| `autoThreshold`   | `number`                                                                                                           | `604800`       | seconds threshold for auto relative→date_time switch                                                            |
| `hasTooltip`      | `boolean`                                                                                                          | `true`         | show full time tooltip on hover (relative mode)                                                                 |
| `isTimezoneShown` | `boolean`                                                                                                          | `false`        | append timezone abbreviation                                                                                    |
| `isLive`          | `boolean`                                                                                                          | `false`        | live-update relative time                                                                                       |
| `type`            | `'body' \| 'large' \| 'label' \| 'supporting' \| 'code' \| 'display-1' \| 'display-2' \| 'display-3' \| 'inherit'` | `'supporting'` | Text semantic type                                                                                              |
| `size`            | `'4xs' \| '3xs' \| '2xs' \| 'xsm' \| 'sm' \| 'base' \| 'lg' \| 'xl' \| '2xl' \| '3xl' \| '4xl'`                    | —              | font size override                                                                                              |
| `color`           | `'primary' \| 'secondary' \| 'disabled' \| 'placeholder' \| 'accent' \| 'inherit'`                                 | `'secondary'`  | text color                                                                                                      |
| `weight`          | `'normal' \| 'medium' \| 'semibold' \| 'bold'`                                                                     | —              | font weight override                                                                                            |

## Theming

| Component class    | Preferred data attributes                | Props               | States |
| ------------------ | ---------------------------------------- | ------------------- | ------ |
| `astryx-timestamp` | `data-type`, `data-color`, `data-format` | type, color, format | —      |

Override in defineTheme:

```ts
components: {
  'timestamp': {
    base: { /* CSS properties */ },
    'type:value': { /* variant-specific */ },
  },
}
```

Related block templates:

ChatMessageAvatarName
Messages with avatars and sender names. Place the name on the bubble when using bubbles, or on the message wrapper for raw content.
ChatMessageGhost
Ghost variant for messages without visible bubble boundaries. Keeps padding for alignment but renders a transparent background, useful for AI-style responses.
ChatMessageMultiBubble
Grouped bubbles using the group prop for corner radius reduction. Use first, middle, and last to visually connect related bubbles from the same sender.
ChatMessageShowcase
A user multi-bubble group with delivery status and an assistant ghost response with avatar, name, timestamp, and model info.
ChatMessageBubbleGrouping
Multi-bubble messages using first, middle, and last group positions. Grouped bubbles tighten corner radius on the sender side for a continuous visual flow.
ChatMessageBubbleMetadata
Bubbles with name and metadata slots aligned to bubble padding. Put name on the first bubble and metadata on the last bubble in a message.
ChatMessageBubbleShowcase
Grouped user bubbles with filled styling and a ghost-variant agent response, with timestamps and delivery status.
ChatMessageListFullFeatured
Conversation showcasing system messages, multi-bubble grouping, markdown, code blocks, and metadata. Combines date dividers, ghost bubbles, grouped messages, and rich content in a single example.
ChatMessageListShowcase
Basic AI chat conversation with user and assistant messages. The simplest way to render a message list with alternating sender bubbles, metadata, and a date divider.
ChatMessageMetadataFooter
Assistant message with footer actions: copy, retry, thumbs up/down, and model label. Use for AI responses that need feedback or utility controls.
ChatMessageMetadataShowcase
Three-message conversation showcasing error status with retry, delivery status, and full footer actions with model label.
ChatMessageMetadataStatus
All 5 delivery statuses (sending, sent, delivered, read, and error), each with a timestamp. Use to show message delivery progress or surface failures.
ChatMessageMetadataTimestamp
Timestamp-only metadata on user and assistant messages. Supports absolute time and relative formats via Timestamp.
TimestampAutoFormat
Auto format that shows relative time for recent dates and switches to the full date for older ones. The default choice for most use cases.
TimestampColors
Timestamp rendered in each available color variant: primary, secondary, disabled, and active.
TimestampFormats
All display formats side by side: date, date_time, time, and their system equivalents. Use date and date_time for user-facing UI, system variants for logs and dev tools.
TimestampRelativeFormat
Relative time labels from seconds to months ago, with hover tooltips showing the full date. Use in feeds, comment threads, and activity logs.
TimestampShowcase
TimestampTimezone
Timestamps with the timezone abbreviation appended. Enable isTimezoneShown for audiences across time zones, like audit logs or team calendars.

---

# Token

Token is a small, inline element for representing discrete pieces of associated data, like tags, categories, or selections. Use for labeling content, showing active filters, or representing removable items.

**Import:** `import {Token} from '@astryxdesign/core/Token';`

## Anatomy

| Element       | Required | Description                                                                           |
| ------------- | -------- | ------------------------------------------------------------------------------------- |
| Icon          | No       | A leading icon that identifies the token type, like a user avatar or category symbol. |
| Label         | Yes      | The visible text. Also used as the accessible name when isLabelHidden is true.        |
| End content   | No       | Trailing content after the label, like a count badge or status dot.                   |
| Remove button | No       | An X button that appears when onRemove is provided, letting users dismiss the token.  |

## Best Practices

- **Do:** Color-code categories (green for active, red for blocked, blue for review) for fast scanning.
- **Do:** Provide onRemove when tokens represent dismissible user selections like filters or multi-select values.
- **Do:** Add a leading icon when it helps identify the token type: person icon for users, tag icon for labels.
- **Do:** Keep labels to one to three words. Tokens truncate with ellipsis on overflow.
- **Don't:** Don't use tokens for actions or navigation; use Button or Link. Tokens display metadata, not trigger workflows.
- **Don't:** Don't hide the label unless the icon alone is universally clear.
- **Don't:** Don't mix too many colors in one group. Two or three meaningful colors keeps it scannable.

## Props

| Prop            | Type                                                                                                                  | Default     | Description                                                                 |
| --------------- | --------------------------------------------------------------------------------------------------------------------- | ----------- | --------------------------------------------------------------------------- |
| `label`         | `string`                                                                                                              | —           | Text label inside token. **(required)**                                     |
| `size`          | `'sm' \| 'md' \| 'lg'`                                                                                                | `'md'`      | Token size; 'sm', 'md', or 'lg'.                                            |
| `color`         | `'default' \| 'red' \| 'orange' \| 'yellow' \| 'green' \| 'teal' \| 'cyan' \| 'blue' \| 'purple' \| 'pink' \| 'gray'` | `'default'` | Color variant of token.                                                     |
| `icon`          | `ReactNode`                                                                                                           | —           | Optional icon before label.                                                 |
| `isDisabled`    | `boolean`                                                                                                             | `false`     | Reduces opacity, blocks interactions.                                       |
| `onRemove`      | `(e: React.MouseEvent) => void`                                                                                       | —           | Fired on remove button click. Renders X button when provided.               |
| `onClick`       | `(e: React.MouseEvent) => void`                                                                                       | —           | Click handler. Renders <span> w/ invisible <button> inside for a11y.        |
| `href`          | `string`                                                                                                              | —           | Link URL. Renders as <a> element.                                           |
| `description`   | `string`                                                                                                              | —           | A11y description via aria-description on root.                              |
| `endContent`    | `ReactNode`                                                                                                           | —           | Content after label, before remove button.                                  |
| `isLabelHidden` | `boolean`                                                                                                             | `false`     | Visually hides label w/ screen-reader-only clip; stays accessible.          |
| `xstyle`        | `StyleXStyles`                                                                                                        | —           | StyleX layout styles (margins, positioning). Must be stylex.create() value. |

## Theming

| Component class | Preferred data attributes | Props       | States |
| --------------- | ------------------------- | ----------- | ------ |
| `astryx-token`  | `data-color`, `data-size` | color, size | —      |

Override in defineTheme:

```ts
components: {
  'token': {
    base: { /* CSS properties */ },
    'color:value': { /* variant-specific */ },
  },
}
```

Related block templates:

ChatComposerAttachments
Chat composer with removable file tokens in a collapsible drawer. Use when users can attach files or context to their message.
ChatComposerFullFeatured
Chat composer with all slots populated: collapsible attachment drawer, header actions, context progress bar, footer dropdown menus, and mic button. Shows the maximum composer configuration.
ChatComposerDrawerAttachments
Drawer with two rows: a scrollable carousel of image thumbnails and a row of removable file tokens. Omit count to keep the drawer always expanded.
ChatComposerDrawerCollapsible
Drawer with many items and a collapse toggle. Pass count to enable the toggle; collapsed state shows a badge with the total count and a label.
ChatComposerDrawerShowcase
Composer drawer with file tokens, a collapsible toggle, and header actions. Use as a starting point for any chat composer with attachments.
ChatComposerDrawerWithProgress
Drawer paired with a context progress bar in the header. Show context window usage when attachments consume part of the available token budget.
ChatMessageListFullFeatured
Conversation showcasing system messages, multi-bubble grouping, markdown, code blocks, and metadata. Combines date dividers, ghost bubbles, grouped messages, and rich content in a single example.
MetadataListMultiColumnMetadata
Multi-column metadata grid with token tags.
TokenClickable
Interactive tokens that respond to clicks. Use for toggleable filters or tokens that open a detail view when selected.
TokenColors
All 11 color variants in default and disabled states. Use color to categorize entities or convey status at a glance.
TokenEndContent
Tokens with trailing content like a count badge or status indicator after the label. Use for notification counts, item quantities, or compact status info.
TokenIcon
Tokens with a leading icon that identifies the entity type. Use when the icon helps users recognize the token category faster, like a user icon for people or a tag icon for labels.
TokenRemovable
Tokens with a dismiss button for selections the user can undo. Use in multi-select fields, active filters, or any list of user-chosen items.
TokenShowcase

---

# TreeList

An expandable tree structure for displaying hierarchical data with branch connector lines. Use it for file explorers, nested category browsers, or any interface that visualizes parent-child relationships.

**Import:** `import {TreeList} from '@astryxdesign/core/TreeList';`

## Best Practices

- **Do:** Provide meaningful labels and icons for each node to make the hierarchy easy to scan.
- **Do:** Pre-expand important branches so users see key content immediately.
- **Don't:** Nest more than 4–5 levels deep; flatten the structure or use a different pattern.
- **Don't:** Use a tree for flat, non-hierarchical data; use a List instead.

## Components

### TreeList

Tree list container. Accepts items data + rendering config. Expansion managed internally.

| Prop      | Type                                    | Default      | Description                                                                           |
| --------- | --------------------------------------- | ------------ | ------------------------------------------------------------------------------------- |
| `items`   | `TreeListItemData[]`                    | —            | Recursive tree item data w/ id, label, optional children + isExpanded. **(required)** |
| `density` | `'compact' \| 'balanced' \| 'spacious'` | `'balanced'` | Spacing density for items.                                                            |
| `header`  | `ReactNode`                             | —            | Header content, linked to tree via aria-labelledby.                                   |
| `xstyle`  | `StyleXStyles`                          | —            | StyleX styles for layout. Must be stylex.create() value.                              |

## Theming

| Component class         | Preferred data attributes                        | Props   | States             |
| ----------------------- | ------------------------------------------------ | ------- | ------------------ |
| `astryx-tree-list`      | `data-density`                                   | density | —                  |
| `astryx-tree-list-item` | `data-density`, `data-selected`, `data-disabled` | density | selected, disabled |

Override in defineTheme:

```ts
components: {
  'tree-list': {
    base: { /* CSS properties */ },
    'density:value': { /* variant-specific */ },
  },
  'tree-list-item': {
    base: { /* CSS properties */ },
    'selected': { /* state-specific */ },
  },
}
```

Related block templates:

TreeListFileTreeWithIcons
File browser tree with folder and document icons distinguishing directories from files.
TreeListInteractiveSettings
Settings tree with clickable items and a documentation link.
TreeListMailboxTree
Email folder tree with unread badge counts.
TreeListNavigationTree
Navigation tree with a selected item for the current page.
TreeListShowcase

---

# Collapsible

Collapsible hides and reveals content behind a trigger button. Use in settings, FAQs, or detail views. Wrap in CollapsibleGroup for accordion behavior.

**Import:** `import {Collapsible} from '@astryxdesign/core/Collapsible';`

## Anatomy

| Element | Required | Description                                                                                |
| ------- | -------- | ------------------------------------------------------------------------------------------ |
| Trigger | Yes      | The always-visible button that toggles the content. Shows a label and a chevron indicator. |
| Chevron | No       | Animated arrow that rotates to show open or closed state.                                  |
| Content | No       | The area that hides or reveals when the trigger is clicked.                                |

## Best Practices

- **Do:** Use hasDividers on CollapsibleGroup for FAQ-style lists: built-in row hairlines, no hand-rolled borders.
- **Do:** Wrap each Collapsible in an Card for visual separation, or use CollapsibleGroup's hasDividers for flat lists; not both.
- **Do:** Use CollapsibleGroup with type="single" for settings or FAQ pages where only one section should be open at a time.
- **Do:** Use type="multiple" when users need to compare across sections.
- **Do:** Start sections open (defaultIsOpen) when content is needed on first view.
- **Don't:** Hide critical content behind a collapsible; users may not discover it.
- **Don't:** Nest collapsibles more than two levels deep; makes content hard to find and navigate.
- **Don't:** Use a collapsible for a single short paragraph; just show the text directly instead.

## Props

| Prop            | Type                        | Default | Description                                                                                                                                |
| --------------- | --------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `trigger`       | `ReactNode`                 | —       | Content shown in the trigger area (always visible). **(required)**                                                                         |
| `children`      | `ReactNode`                 | —       | Content that collapses and expands.                                                                                                        |
| `defaultIsOpen` | `boolean`                   | `true`  | Default open state (uncontrolled).                                                                                                         |
| `isOpen`        | `boolean`                   | —       | Controlled open state.                                                                                                                     |
| `isDisabled`    | `boolean`                   | `false` | Disable the item so its trigger can't be toggled (dimmed, aria-disabled, and out of the tab order). Doesn't collapse an already-open item. |
| `onOpenChange`  | `(isOpen: boolean) => void` | —       | Callback invoked when the open state changes.                                                                                              |
| `value`         | `string`                    | —       | Identifier used for group coordination. Required when placed inside an CollapsibleGroup.                                                   |

## Components

### CollapsibleGroup

See `npx astryx component CollapsibleGroup` for props and usage.

## Theming

| Component class              | Preferred data attributes | Props   | States |
| ---------------------------- | ------------------------- | ------- | ------ |
| `astryx-collapsible`         | `data-density`            | density | —      |
| `astryx-collapsible-content` | `data-density`            | density | —      |
| `astryx-collapsible-group`   | `data-density`            | density | —      |

Override in defineTheme:

```ts
components: {
  'collapsible': {
    base: { /* CSS properties */ },
    'density:value': { /* variant-specific */ },
  },
  'collapsible-content': {
    base: { /* CSS properties */ },
  },
}
```

Related block templates:

CollapsibleControlledAccordion
Manage the open section from parent state. Use when the open state needs to sync with a URL param, form, or external control.
CollapsibleDividedAccordion
FAQ-style accordion using the hasDividers prop on CollapsibleGroup: built-in row hairlines and density padding with zero custom CSS. Use for FAQs, settings lists, and nav sections.
CollapsibleHookUsage
Custom disclosure UI built directly with useCollapsible for headless open/close state.
CollapsibleMultipleAccordion
Several sections open at once. Use when users need to compare content across sections, like feature lists or pricing tiers.
CollapsibleShowcase
An accordion group with three collapsible sections in single mode: opening one closes the others.
CollapsibleSingleAccordion
Only one section open at a time. Use for settings pages or any list where expanding one item should close the others.
CollapsibleWithoutCard
Collapsible sections separated by dividers instead of cards. Use for inline disclosure in detail panels or sidebar content where cards would add too much weight.
CollapsibleGroupAccordion
An accordion built with type="single": opening one Collapsible automatically closes the others. Use defaultValue to pre-expand the most important section.
CollapsibleGroupShowcase
CollapsibleGroup coordinates multiple Collapsible components so that expanding one can automatically collapse the others, creating accordion behavior.

---

# HoverCard

HoverCard shows additional info on hover/focus. Use for profile cards, link summaries, inline definitions.

**Import:** `import {HoverCard} from '@astryxdesign/core/HoverCard';`

## Anatomy

| Element | Required | Description                                                                              |
| ------- | -------- | ---------------------------------------------------------------------------------------- |
| Trigger | Yes      | The element that opens the hover card on hover or focus: a button, link, or inline text. |
| Card    | Yes      | The floating overlay with the preview content, anchored to the trigger.                  |
| Body    | Yes      | The main content area: profile info, link summary, or any rich content.                  |
| Actions | No       | Optional buttons inside the card for follow-up actions like Follow or Message.           |

## Best Practices

- **Do:** Keep content supplementary; hover cards should enhance understanding without blocking the primary workflow.
- **Do:** Provide a dashed underline on text triggers so users know the element is hoverable.
- **Do:** Use the hook API (useHoverCard) when you need more control over timing or placement.
- **Don't:** Place critical actions or required information inside a hover card; users may miss content that only appears on hover.
- **Don't:** Use a hover card when a simple Tooltip or Popover would suffice.
- **Don't:** Use a HoverCard for content the user must interact with; it disappears when the cursor leaves.
- **Don't:** Nest a block-content HoverCard directly inside phrasing-only contexts (<p>, <label>, heading); it renders inline so block content is invalid HTML there. Wrap surrounding text in a block element instead.

## Components

### HoverCard

Component wrapper for hover card overlay; richer overlay triggered on hover/focus.

| Prop                 | Type                                     | Default    | Description                                                                                                     |
| -------------------- | ---------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------- |
| `children`           | `ReactNode`                              | —          | Trigger element; must accept ref.                                                                               |
| `content`            | `ReactNode`                              | —          | Hover card content. **(required)**                                                                              |
| `placement`          | `'above' \| 'below' \| 'start' \| 'end'` | `'above'`  | Position relative to anchor element. Logical: start/end follow the popover's inherited direction (RTL mirrors). |
| `alignment`          | `'start' \| 'center' \| 'end'`           | `'center'` | Alignment along placement axis. Logical: start/end follow the popover's inherited direction (RTL mirrors).      |
| `delay`              | `number`                                 | `300`      | Show delay in ms.                                                                                               |
| `hideDelay`          | `number`                                 | `200`      | Hide delay in ms.                                                                                               |
| `focusTrigger`       | `'auto' \| 'always' \| 'never'`          | `'auto'`   | Controls when focus events trigger hover card.                                                                  |
| `isEnabled`          | `boolean`                                | `true`     | Enable/disable hover + focus triggers.                                                                          |
| `onOpenChange`       | `(isOpen: boolean) => void`              | —          | Callback when visibility changes; true=shown, false=hidden.                                                     |
| `hasHoverIndication` | `'auto' \| boolean`                      | `'auto'`   | Dashed underline on trigger element.                                                                            |
| `isDefaultOpen`      | `boolean`                                | —          | Show hover card on mount. Still dismissible.                                                                    |

## Theming

| Component class    | Preferred data attributes | Props | States |
| ------------------ | ------------------------- | ----- | ------ |
| `astryx-hovercard` | —                         | —     | —      |

Override in defineTheme:

```ts
components: {
  'hovercard': {
    base: { /* CSS properties */ },
  },
}
```

Some properties are set via standard CSS in component overrides:

```ts
components: {
  hovercard: {
    base: {
      borderRadius: '...',
    },
  },
}
```

Related block templates:

HoverCardHookUsage
Custom profile preview using useHoverCard with direct trigger and render control.
HoverCardInlineTextHoverCard
Shows a term definition on hover within a paragraph. Use for technical terms, jargon, or concepts that some readers may not know, like a glossary built into the text.
HoverCardInteractiveContent
Shows a page summary when hovering a link: title, description, and URL. Use for documentation links, article references, or any URL where a preview helps the user decide whether to click.
HoverCardProfileHoverCard
Shows a user profile summary on hover with name, role, and bio. Use on usernames, avatars, or mentions to let users preview a profile without navigating away.
HoverCardShowcase
A hover card that shows a user profile preview when hovering over a trigger button. Starts open for preview.

---

# NumberInput

A form input for numeric values with built-in validation, min/max constraints, and step controls. Use NumberInput for quantities, measurements, percentages, and similar inputs.

**Import:** `import {NumberInput} from '@astryxdesign/core/NumberInput';`

## Anatomy

| Element     | Required | Description                                     |
| ----------- | -------- | ----------------------------------------------- |
| Label       | Yes      | The label for the number input.                 |
| Description | No       | Additional description text below the label.    |
| Icon        | No       | An optional icon within the input.              |
| Placeholder | No       | Placeholder text shown when the input is empty. |
| Spinner     | No       | Increment and decrement controls for the value. |

## Best Practices

- **Do:** Set min, max, and step to guide users toward valid values.
- **Do:** Show units (e.g. "%" or "GB") so users know what the number represents.
- **Don't:** Use NumberInput for free-form text that happens to contain numbers; use TextInput instead.
- **Don't:** Set both isOptional and isRequired on the same field.
- **Don't:** Wrap a disabled NumberInput in Tooltip to explain why it's disabled; disabled controls swallow the hover events the wrapper needs. Use the disabledMessage prop instead.

## Props

| Prop              | Type                                                          | Default | Description                                                                                                                                                                                                   |
| ----------------- | ------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `label`           | `string`                                                      | —       | Label text (always rendered for accessibility). **(required)**                                                                                                                                                |
| `value`           | `number \| null \| undefined`                                 | —       | Current input value. **(required)**                                                                                                                                                                           |
| `onChange`        | `(value: number) => void`                                     | —       | Callback on valid input change. **(required)**                                                                                                                                                                |
| `size`            | `'sm' \| 'md' \| 'lg'`                                        | `'md'`  | Size variant.                                                                                                                                                                                                 |
| `isLabelHidden`   | `boolean`                                                     | —       | Visually hide label (still accessible to screen readers).                                                                                                                                                     |
| `description`     | `string`                                                      | —       | Text between label + input.                                                                                                                                                                                   |
| `isOptional`      | `boolean`                                                     | —       | Field optional (mutually exclusive w/ isRequired).                                                                                                                                                            |
| `isRequired`      | `boolean`                                                     | —       | Field required (mutually exclusive w/ isOptional).                                                                                                                                                            |
| `isDisabled`      | `boolean`                                                     | —       | Input disabled.                                                                                                                                                                                               |
| `disabledMessage` | `string`                                                      | —       | Explains why input is disabled. With isDisabled, shows tooltip on hover/focus + keeps input focusable via aria-disabled (field becomes read-only). Use instead of wrapping a disabled NumberInput in Tooltip. |
| `placeholder`     | `string`                                                      | —       | Placeholder text.                                                                                                                                                                                             |
| `labelTooltip`    | `string`                                                      | —       | Tooltip text in info icon at label end.                                                                                                                                                                       |
| `startIcon`       | `IconType`                                                    | —       | Icon at input start.                                                                                                                                                                                          |
| `labelIcon`       | `IconType`                                                    | —       | Icon before label text.                                                                                                                                                                                       |
| `status`          | `{type: 'error' \| 'warning' \| 'success', message?: string}` | —       | Validation status w/ optional message.                                                                                                                                                                        |
| `min`             | `number \| null`                                              | —       | Minimum value allowed.                                                                                                                                                                                        |
| `max`             | `number \| null`                                              | —       | Maximum value allowed.                                                                                                                                                                                        |
| `step`            | `number \| null`                                              | `1`     | Step increment.                                                                                                                                                                                               |
| `units`           | `string \| null`                                              | —       | Units suffix (e.g. "%" or "GB").                                                                                                                                                                              |
| `isIntegerOnly`   | `boolean`                                                     | —       | Only allow integer values.                                                                                                                                                                                    |
| `hasClear`        | `boolean`                                                     | `false` | Shows clear button when input has value. onChange also accepts null on clear.                                                                                                                                 |
| `htmlName`        | `string`                                                      | —       | HTML name for form submissions.                                                                                                                                                                               |
| `autoComplete`    | `string`                                                      | —       | HTML autocomplete attribute.                                                                                                                                                                                  |
| `hasAutoFocus`    | `boolean`                                                     | —       | Focus input on mount.                                                                                                                                                                                         |
| `onFocus`         | `(e: FocusEvent<HTMLInputElement>) => void`                   | —       | Callback on focus.                                                                                                                                                                                            |
| `onBlur`          | `(e: FocusEvent<HTMLInputElement>) => void`                   | —       | Callback on blur.                                                                                                                                                                                             |
| `onEnter`         | `() => void`                                                  | —       | Callback on Enter key.                                                                                                                                                                                        |

## Theming

| Component class       | Preferred data attributes  | Props        | States |
| --------------------- | -------------------------- | ------------ | ------ |
| `astryx-number-input` | `data-size`, `data-status` | size, status | —      |

Override in defineTheme:

```ts
components: {
  'number-input': {
    base: { /* CSS properties */ },
    'size:value': { /* variant-specific */ },
  },
}
```

Related block templates:

NumberInputClearableNumberInput
Number input with a clear button, unit suffix, and min/max constraint
NumberInputRangeNumberInput
Number input with min/max boundaries and a helper description
NumberInputShowcase
A number input for quantity entry.
NumberInputStatuses
Number inputs showing error, warning, and success validation states
NumberInputWithUnits
Number input with a percentage unit suffix and valid range

---

# FileInput

FileInput provides file upload with optional drag-and-drop support. Use it for single or multiple file selection with built-in validation for file type, size, and count.

**Import:** `import {FileInput} from '@astryxdesign/core/FileInput';`

## Anatomy

| Element           | Required | Description                                                                                  |
| ----------------- | -------- | -------------------------------------------------------------------------------------------- |
| Label             | Yes      | Text that identifies the field. Always rendered for accessibility even when visually hidden. |
| Description       | No       | Helper text between the label and the drop zone explaining accepted formats or size limits.  |
| Drop zone         | Yes      | The clickable area for file selection. In dropzone mode, also accepts dragged files.         |
| Upload icon       | No       | An arrow icon in the drop zone hinting at the upload action.                                 |
| Placeholder       | No       | Hint text shown when no files are selected.                                                  |
| File name display | No       | Shows the name(s) of selected files.                                                         |
| Clear button      | No       | A close button that removes selected files and returns focus to the input.                   |
| Spinner           | No       | Loading indicator that appears during async upload actions.                                  |
| Status message    | No       | Validation feedback showing error, warning, or success with a message.                       |

## Best Practices

- **Do:** Always specify an accept prop to guide users toward valid file types.
- **Do:** Use maxSize and maxFiles to prevent oversized uploads.
- **Do:** Add a description to communicate constraints.
- **Do:** Use changeAction for immediate upload workflows that benefit from optimistic UI.
- **Don't:** Don't use FileInput for directory uploads.
- **Don't:** Don't use mode='input' unless space is constrained; dropzone mode provides a better experience.
- **Don't:** Don't wrap a disabled FileInput in Tooltip to explain the disabled state; use the disabledMessage prop instead.

## Props

| Prop              | Type                                                          | Default                           | Description                                                                                                                                                                                                        |
| ----------------- | ------------------------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `label`           | `string`                                                      | —                                 | Accessible label for the file input. **(required)**                                                                                                                                                                |
| `value`           | `File \| File[] \| null`                                      | —                                 | Currently selected file(s). Controlled. **(required)**                                                                                                                                                             |
| `onChange`        | `(files: File \| File[] \| null) => void`                     | —                                 | Fired when files are selected or removed. **(required)**                                                                                                                                                           |
| `changeAction`    | `(files: File \| File[] \| null) => Promise<void>`            | —                                 | Async action after onChange. For immediate upload.                                                                                                                                                                 |
| `accept`          | `string`                                                      | —                                 | Accepted file types (HTML accept format).                                                                                                                                                                          |
| `isMultiple`      | `boolean`                                                     | `false`                           | Allow multiple file selection.                                                                                                                                                                                     |
| `maxSize`         | `number`                                                      | —                                 | Max file size in bytes. Rejects oversized files.                                                                                                                                                                   |
| `maxFiles`        | `number`                                                      | —                                 | Max file count (isMultiple only).                                                                                                                                                                                  |
| `isLabelHidden`   | `boolean`                                                     | `false`                           | Visually hides label; keeps screen reader access.                                                                                                                                                                  |
| `description`     | `string`                                                      | —                                 | Description text between label+input.                                                                                                                                                                              |
| `isOptional`      | `boolean`                                                     | `false`                           | Shows "Optional" indicator.                                                                                                                                                                                        |
| `isRequired`      | `boolean`                                                     | `false`                           | Shows "Required" indicator+sets aria-required.                                                                                                                                                                     |
| `isDisabled`      | `boolean`                                                     | `false`                           | Disables input, prevents interaction.                                                                                                                                                                              |
| `disabledMessage` | `string`                                                      | —                                 | Explains why input is disabled. With isDisabled, shows tooltip on hover/focus + keeps trigger focusable via aria-disabled (opening picker stays blocked). Use instead of wrapping a disabled FileInput in Tooltip. |
| `isLoading`       | `boolean`                                                     | `false`                           | Loading state w/ spinner+aria-busy.                                                                                                                                                                                |
| `placeholder`     | `string`                                                      | `"Choose file" or "Choose files"` | Placeholder when no files selected.                                                                                                                                                                                |
| `mode`            | `'input' \| 'dropzone'`                                       | `'input'`                         | Visual mode: 'input' (compact) or 'dropzone' (drag-and-drop).                                                                                                                                                      |
| `status`          | `{type: 'error' \| 'warning' \| 'success', message?: string}` | —                                 | Validation status; colored border. Message floats below.                                                                                                                                                           |
| `labelTooltip`    | `string`                                                      | —                                 | Tooltip in info icon at label end.                                                                                                                                                                                 |

## Theming

| Component class     | Preferred data attributes  | Props        | States |
| ------------------- | -------------------------- | ------------ | ------ |
| `astryx-file-input` | `data-mode`, `data-status` | mode, status | —      |

Override in defineTheme:

```ts
components: {
  'file-input': {
    base: { /* CSS properties */ },
    'mode:value': { /* variant-specific */ },
  },
}
```

Related block templates:

FileInputBasic
A controlled single-file upload with accepted types, a size limit, and helper text. Use for standard document upload fields in forms.
FileInputShowcase

---

# RadioList

A group of options where only one can be selected at a time. All options are visible at once, making it easy to compare choices. Use it when users need to pick one option from a small set.

**Import:** `import {RadioList} from '@astryxdesign/core/RadioList';`

## Anatomy

| Element     | Required | Description                                              |
| ----------- | -------- | -------------------------------------------------------- |
| Header      | No       | Optional heading above the radio list.                   |
| Children    | Yes      | The radio list items rendered as selectable options.     |
| Label/Value | Yes      | The text label and associated value for each radio item. |

## Best Practices

- **Do:** Keep the number of options small: typically 2 to 7 choices.
- **Do:** Use clear, concise labels that differentiate each option at a glance.
- **Do:** Pre-select a default option when there's a sensible default; don't leave the group empty unless the choice is optional.
- **Don't:** Use when multiple selections are needed; use CheckboxList instead.
- **Don't:** Use for long lists; use Selector for better discoverability.
- **Don't:** Use horizontal layout with more than 4 options; it wraps awkwardly.
- **Don't:** Wrap a disabled RadioList in Tooltip to explain why it is disabled; disabled controls swallow the hover events the wrapper needs. Use the disabledMessage prop instead.

## Props

| Prop              | Type                                                          | Default      | Description                                                                                                                                                                                                                                                                                                                                                                        |
| ----------------- | ------------------------------------------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `label`           | `string`                                                      | —            | Label text for the radio group (always rendered for accessibility). **(required)**                                                                                                                                                                                                                                                                                                 |
| `value`           | `string`                                                      | —            | The currently selected value. **(required)**                                                                                                                                                                                                                                                                                                                                       |
| `onChange`        | `(value: string) => void`                                     | —            | Callback fired when the selected value changes. **(required)**                                                                                                                                                                                                                                                                                                                     |
| `children`        | `ReactNode`                                                   | —            | RadioListItem elements. **(required)**                                                                                                                                                                                                                                                                                                                                             |
| `isLabelHidden`   | `boolean`                                                     | `false`      | Whether to visually hide the label.                                                                                                                                                                                                                                                                                                                                                |
| `description`     | `string`                                                      | —            | Description text displayed below the label.                                                                                                                                                                                                                                                                                                                                        |
| `orientation`     | `'vertical' \| 'horizontal'`                                  | `'vertical'` | Layout direction of the radio items.                                                                                                                                                                                                                                                                                                                                               |
| `isDisabled`      | `boolean`                                                     | `false`      | Whether all radio items are disabled.                                                                                                                                                                                                                                                                                                                                              |
| `htmlName`        | `string`                                                      | —            | The HTML name attribute shared by the radio inputs, useful for form submissions. When omitted, a unique internal name still groups the radios.                                                                                                                                                                                                                                     |
| `disabledMessage` | `string`                                                      | —            | Explains why the group is disabled. Applies to the whole-group disabled state (isDisabled), not per item. With isDisabled, shows a tooltip on hover/keyboard focus and keeps the radios focusable via aria-disabled (selection stays blocked). Use this instead of wrapping a disabled RadioList in Tooltip. Disabled controls swallow the hover events an external Tooltip needs. |
| `isRequired`      | `boolean`                                                     | `false`      | Whether the radio group is required.                                                                                                                                                                                                                                                                                                                                               |
| `isOptional`      | `boolean`                                                     | `false`      | Whether the field is optional (mutually exclusive with isRequired).                                                                                                                                                                                                                                                                                                                |
| `status`          | `{type: 'warning' \| 'error' \| 'success', message?: string}` | —            | Status indicator ({ type, message }).                                                                                                                                                                                                                                                                                                                                              |
| `size`            | `'sm' \| 'md'`                                                | `'md'`       | Size of the radio controls.                                                                                                                                                                                                                                                                                                                                                        |
| `labelTooltip`    | `string`                                                      | —            | Tooltip text for an info icon next to the label.                                                                                                                                                                                                                                                                                                                                   |
| `xstyle`          | `StyleXStyles`                                                | —            | StyleX styles for layout customization (margins, positioning, sizing). Must be a stylex.create() value: not an inline style object like style={{}}.                                                                                                                                                                                                                                |

## Components

### RadioListItem

See `npx astryx component RadioListItem` for props and usage.

## Theming

| Component class          | Preferred data attributes                    | Props             | States            |
| ------------------------ | -------------------------------------------- | ----------------- | ----------------- |
| `astryx-radio-list`      | `data-orientation`, `data-size`              | orientation, size | —                 |
| `astryx-radio-list-item` | —                                            | —                 | —                 |
| `astryx-radio`           | `data-size`, `data-checked`, `data-disabled` | size              | checked, disabled |
| `astryx-radio-dot`       | `data-size`                                  | size              | —                 |

Override in defineTheme:

```ts
components: {
  'radio-list': {
    base: { /* CSS properties */ },
    'orientation:value': { /* variant-specific */ },
  },
  'radio-list-item': {
    base: { /* CSS properties */ },
  },
}
```

Related block templates:

RadioListHorizontalLayout
Radio list with horizontal orientation for compact selections.
RadioListPricingTier
Radio list with pricing info in end content for plan selection.
RadioListShowcase
RadioListWithDescriptions
Radio list with descriptions on the group and each item.
RadioListWithValidation
Required radio list with an error message when nothing is selected.
RadioListItemBasic
Radio items with labels and descriptions inside a controlled RadioList. Use for single-choice option groups like shipping methods.
RadioListItemShowcase
Radio list items with labels, descriptions, and different states including disabled.

---

# Slider

A draggable control for selecting a numeric value or range within defined bounds. Supports single value and range selection, tick marks, custom value formatting, and vertical orientation. Use it when users need to explore a continuous range, such as volume, price, or percentage.

**Import:** `import {Slider} from '@astryxdesign/core/Slider';`

## Best Practices

- **Do:** Always provide a label, even if visually hidden, so the slider is accessible to screen readers.
- **Do:** Format values with meaningful units like "$50" or "75%" instead of raw numbers.
- **Don't:** Use for precise numeric entry; pair with a text input or use NumberInput instead.
- **Don't:** Set a step size so large that only a few positions are possible; use SegmentedControl or radio buttons instead.
- **Don't:** Wrap a disabled slider in Tooltip to explain why it is disabled; disabled controls swallow the hover events the wrapper needs. Use the disabledMessage prop instead.

## Props

| Prop                    | Type                                                           | Default        | Description                                                                                                                                                                                                                                                                                                  |
| ----------------------- | -------------------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `label`                 | `string`                                                       | —              | Label text (always rendered for a11y). **(required)**                                                                                                                                                                                                                                                        |
| `value`                 | `number \| [number, number]`                                   | —              | Current value; number for single thumb, [number, number] for range. **(required)**                                                                                                                                                                                                                           |
| `onChange`              | `(value: number) => void \| (value: [number, number]) => void` | —              | Fired on value change during drag.                                                                                                                                                                                                                                                                           |
| `onChangeEnd`           | `(value: number) => void \| (value: [number, number]) => void` | —              | Fired when drag ends.                                                                                                                                                                                                                                                                                        |
| `min`                   | `number`                                                       | `0`            | Minimum value.                                                                                                                                                                                                                                                                                               |
| `max`                   | `number`                                                       | `100`          | Maximum value.                                                                                                                                                                                                                                                                                               |
| `step`                  | `number`                                                       | `1`            | Step increment.                                                                                                                                                                                                                                                                                              |
| `orientation`           | `'horizontal' \| 'vertical'`                                   | `'horizontal'` | Slider orientation.                                                                                                                                                                                                                                                                                          |
| `formatValue`           | `(value: number) => string`                                    | —              | Custom value formatting fn for display + aria-valuetext.                                                                                                                                                                                                                                                     |
| `valueDisplay`          | `'tooltip' \| 'text' \| 'none'`                                | `'tooltip'`    | How current value is displayed.                                                                                                                                                                                                                                                                              |
| `marks`                 | `Array<{ value: number; label?: string }>`                     | —              | Tick marks at specified positions w/ optional labels.                                                                                                                                                                                                                                                        |
| `minStepsBetweenThumbs` | `number`                                                       | `0`            | Min steps between thumbs in range mode; prevents overlap.                                                                                                                                                                                                                                                    |
| `isDisabled`            | `boolean`                                                      | `false`        | Whether slider is disabled.                                                                                                                                                                                                                                                                                  |
| `htmlName`              | `string`                                                       | —              | HTML name attr; hidden inputs carry the value (two in range mode).                                                                                                                                                                                                                                           |
| `disabledMessage`       | `string`                                                       | —              | Explains why the slider is disabled. With isDisabled, shows a tooltip on hover/keyboard focus and keeps the thumb focusable via aria-disabled (value changes stay blocked). Use this instead of wrapping a disabled Slider in Tooltip. Disabled controls swallow the hover events an external Tooltip needs. |
| `isOptional`            | `boolean`                                                      | `false`        | Whether field is optional.                                                                                                                                                                                                                                                                                   |
| `isRequired`            | `boolean`                                                      | `false`        | Whether field is required.                                                                                                                                                                                                                                                                                   |
| `isLabelHidden`         | `boolean`                                                      | `false`        | Visually hide label.                                                                                                                                                                                                                                                                                         |
| `description`           | `string`                                                       | —              | Description text below label.                                                                                                                                                                                                                                                                                |
| `status`                | `{type: 'warning' \| 'error' \| 'success', message?: string}`  | —              | Status indicator ({type, message}) for validation feedback.                                                                                                                                                                                                                                                  |
| `labelTooltip`          | `string`                                                       | —              | Tooltip text for info icon next to label.                                                                                                                                                                                                                                                                    |
| `xstyle`                | `StyleXStyles`                                                 | —              | StyleX layout styles; must be stylex.create() value.                                                                                                                                                                                                                                                         |

## Theming

| Component class       | Preferred data attributes           | Props       | States   |
| --------------------- | ----------------------------------- | ----------- | -------- |
| `astryx-slider`       | `data-orientation`, `data-disabled` | orientation | disabled |
| `astryx-slider-track` | `data-orientation`                  | orientation | —        |
| `astryx-slider-thumb` | `data-orientation`, `data-disabled` | orientation | disabled |

Override in defineTheme:

```ts
components: {
  'slider': {
    base: { /* CSS properties */ },
    'orientation:value': { /* variant-specific */ },
    'disabled': { /* state-specific */ },
  },
  'slider-track': {
    base: { /* CSS properties */ },
  },
}
```

Related block templates:

SliderFormattedValue
Slider with custom formatting showing temperature in Fahrenheit.
SliderRangeSlider
Range slider for selecting a value range like price bounds.
SliderShowcase
A slider control set to 50%.
SliderWithMarks
Slider with labeled tick marks at fixed intervals.
SliderWithStatus
Sliders with error, warning, and success validation states.

---

# Overlay

Overlay layers compact actions or supporting content over media, cards, or bounded surfaces with optional dark/light scrim and hover/focus/controlled reveal.

**Import:** `import {Overlay} from '@astryxdesign/core/Overlay';`

## Anatomy

| Element         | Required | Description                                                               |
| --------------- | -------- | ------------------------------------------------------------------------- |
| Base content    | No       | The media, card, or bounded surface that the overlay sits on top of.      |
| Scrim           | No       | Optional dark or light overlay background that improves content contrast. |
| Overlay content | Yes      | Actions, labels, or supporting content rendered above the base surface.   |

## Best Practices

- **Do:** Use for short contextual actions/labels tied to the underlying surface.
- **Do:** Keep content compact and legible over the scrim.
- **Don't:** Do not use for floating anchored surfaces; use Popover, Tooltip, or Dialog.

## Props

| Prop        | Type                                                 | Default    | Description                                                  |
| ----------- | ---------------------------------------------------- | ---------- | ------------------------------------------------------------ |
| `content`   | `ReactNode`                                          | —          | overlay content inside scrim; required **(required)**        |
| `children`  | `ReactNode`                                          | —          | base media/card/surface beneath overlay                      |
| `showOn`    | `'hover' \| 'always' \| 'focus' \| 'hover-or-focus'` | `'always'` | visibility trigger; hover also focus-visible; default always |
| `isOpen`    | `boolean`                                            | —          | controlled visibility override                               |
| `scrim`     | `'dark' \| 'light' \| false`                         | `'dark'`   | dark/light scrim or false for no scrim; default dark         |
| `position`  | `'fill' \| 'bottom' \| 'top'`                        | `'fill'`   | scrim placement: fill, bottom strip, or top strip            |
| `align`     | `'start' \| 'center' \| 'end'`                       | `'end'`    | content alignment inside scrim                               |
| `xstyle`    | `StyleXStyles`                                       | —          | StyleX layout styles; must be stylex.create() value          |
| `className` | `string`                                             | —          | additional root class names                                  |
| `style`     | `React.CSSProperties`                                | —          | inline root styles; prefer xstyle                            |
| `ref`       | `Ref<HTMLDivElement>`                                | —          | forwarded root div ref                                       |

## Theming

| Component class        | Preferred data attributes | Props    | States |
| ---------------------- | ------------------------- | -------- | ------ |
| `astryx-overlay`       | —                         | —        | —      |
| `astryx-overlay-scrim` | `data-position`           | position | —      |

Override in defineTheme:

```ts
components: {
  'overlay': {
    base: { /* CSS properties */ },
  },
  'overlay-scrim': {
    base: { /* CSS properties */ },
  },
}
```

Related block templates:

OverlayBottomStrip
Places compact supporting content in a bottom scrim strip without covering the entire image.
OverlayHoverReveal
Reveals an overlay action on hover or keyboard focus. Use when actions should stay visually quiet until the media receives attention.
OverlayShowcase
A media card with an always-visible scrim and centered action content.

---

# MetadataList

MetadataList displays key-value pairs for object attributes like quality, condition, and status, in a structured layout. Use it for detail panels, settings summaries, and record information.

**Import:** `import {MetadataList} from '@astryxdesign/core/MetadataList';`

## Anatomy

| Element    | Required | Description                             |
| ---------- | -------- | --------------------------------------- |
| Title      | No       | Optional title for the metadata list.   |
| Label      | Yes      | The key label for each metadata entry.  |
| Metadata   | Yes      | The value displayed in various formats. |
| Disclosure | No       | Collapse/expand control for the list.   |

## Best Practices

- **Do:** Choose label position based on content: "start" for short values, "top" for long or complex values.
- **Do:** Collapse long lists with `maxNumOfItems` to keep the page scannable.
- **Don't:** Use for extensive form input; use a form layout instead.
- **Don't:** Use for data that doesn't have a clear key-value structure.

## Props

| Prop            | Type                                                        | Default                                                                      | Description                                                                                                                                                       |
| --------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `children`      | `ReactNode`                                                 | —                                                                            | Metadata items (MetadataListItem components). **(required)**                                                                                                      |
| `columns`       | `'multi' \| 'single' \| number`                             | `'single'`                                                                   | Column layout mode.                                                                                                                                               |
| `label`         | `{ position?: 'start' \| 'top', width?: number \| string }` | `{ position: 'start' } (single-column) / { position: 'top' } (multi-column)` | Label display configuration. position controls label placement, width sets a custom label column width. Defaults to { position: 'top' } for multi-column layouts. |
| `maxNumOfItems` | `number`                                                    | —                                                                            | Maximum items to show before collapsing with a show more/less toggle.                                                                                             |
| `orientation`   | `'vertical' \| 'horizontal'`                                | `'vertical'`                                                                 | Layout orientation. Horizontal mode flows items in a row with flex-wrap.                                                                                          |
| `title`         | `ReactNode`                                                 | —                                                                            | Optional title or heading above the list.                                                                                                                         |
| `xstyle`        | `StyleXStyles`                                              | —                                                                            | StyleX styles for layout customization. Must be a stylex.create() value.                                                                                          |

## Components

### MetadataListItem

See `npx astryx component MetadataListItem` for props and usage.

## Theming

| Component class             | Preferred data attributes          | Props                | States |
| --------------------------- | ---------------------------------- | -------------------- | ------ |
| `astryx-metadata-list`      | `data-columns`, `data-orientation` | columns, orientation | —      |
| `astryx-metadata-list-item` | —                                  | —                    | —      |

Override in defineTheme:

```ts
components: {
  'metadata-list': {
    base: { /* CSS properties */ },
    'columns:value': { /* variant-specific */ },
  },
  'metadata-list-item': {
    base: { /* CSS properties */ },
  },
}
```

Related block templates:

MetadataListBasicMetadata
Single-column key-value metadata list.
MetadataListCollapsibleMetadata
Metadata list with a show-more toggle after a set number of items.
MetadataListHorizontalMetadata
Horizontal metadata items for compact inline display.
MetadataListMultiColumnMetadata
Multi-column metadata grid with token tags.
MetadataListShowcase
MetadataListItemBasic
Labeled key-value rows inside a MetadataList. Values accept any content, from plain text to components like Badge.
MetadataListItemShowcase
Metadata list items displaying labeled values in various formats including text, badges, and links.

---

# Breadcrumbs

Breadcrumbs show a trail of links from root to current page. Use at the top of detail pages, settings, or nested content.

**Import:** `import {Breadcrumbs} from '@astryxdesign/core/Breadcrumbs';`

## Anatomy

| Element   | Required | Description                                                                       |
| --------- | -------- | --------------------------------------------------------------------------------- |
| Trail     | Yes      | The ordered list of links from root to current page.                              |
| Item      | Yes      | A single step in the trail. Renders as a link or plain text for the current page. |
| Separator | Yes      | The character between items. Defaults to "/" but can be customized.               |
| Icon      | No       | An optional icon before an item label, like a home icon on the first item.        |

## Best Practices

- **Do:** Place above the page heading so user sees location before reading content.
- **Do:** Keep labels short + matching page titles they link to: "Settings" not "Application Settings Page".
- **Do:** Use supporting variant in dense UIs where the breadcrumb should be subtle.
- **Do:** Last item plain text, not a link; represents current page; done automatically when you set isCurrent.
- **Don't:** Use as primary navigation; breadcrumbs supplement, not replace, a main nav.
- **Don't:** Show on top-level pages with no parent.
- **Don't:** Let the trail exceed 5 levels; simplify the hierarchy instead.

## Props

| Prop        | Type                        | Default        | Description                                                                                                                                         |
| ----------- | --------------------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `children`  | `ReactNode`                 | —              | BreadcrumbItem elements to render inside the breadcrumb trail. **(required)**                                                                       |
| `separator` | `ReactNode`                 | `'/'`          | Separator rendered between breadcrumb items.                                                                                                        |
| `variant`   | `'default' \| 'supporting'` | `'default'`    | Visual variant: supporting is smaller with secondary text styling.                                                                                  |
| `label`     | `string`                    | `'Breadcrumb'` | Accessible label for the nav landmark (aria-label).                                                                                                 |
| `xstyle`    | `StyleXStyles`              | —              | StyleX styles for layout customization (margins, positioning, sizing). Must be a stylex.create() value: not an inline style object like style={{}}. |

## Components

### BreadcrumbItem

Individual breadcrumb item. Renders as a link when href is provided, or as plain text for the current page.

| Prop        | Type                      | Default | Description                                                                                                                                |
| ----------- | ------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `children`  | `ReactNode`               | —       | Label content for the breadcrumb item. **(required)**                                                                                      |
| `href`      | `string`                  | —       | URL the breadcrumb links to; omit for non-navigable items.                                                                                 |
| `onClick`   | `(e: MouseEvent) => void` | —       | Click handler for the breadcrumb item.                                                                                                     |
| `isCurrent` | `boolean`                 | `false` | Marks this item as the current page, applying aria-current="page".                                                                         |
| `startIcon` | `ReactNode`               | —       | Icon rendered before the item label.                                                                                                       |
| `as`        | `LinkComponentType`       | —       | Custom link component to render instead of <a>. Overrides the provider-level default from LinkProvider. Only applies to non-current items. |

## Theming

| Component class          | Preferred data attributes | Props               | States |
| ------------------------ | ------------------------- | ------------------- | ------ |
| `astryx-breadcrumb-item` | —                         | —                   | —      |
| `astryx-breadcrumbs`     | `data-variant`            | default, supporting | —      |

Override in defineTheme:

```ts
components: {
  'breadcrumb-item': {
    base: { /* CSS properties */ },
  },
  'breadcrumbs': {
    base: { /* CSS properties */ },
  },
}
```

Related block templates:

BreadcrumbItemBasic
Breadcrumb links inside a Breadcrumbs trail. Ancestor pages get an href; mark the last item with isCurrent to render it as plain text for the current page.
BreadcrumbItemShowcase
BreadcrumbItem represents a single step in a breadcrumb trail, supporting links, icons, current-page markers, and custom link components.
BreadcrumbsCustomSeparator
Swap the default "/" for a different character like chevrons, arrows, or dots. Use when the visual style of the page calls for a different separator.
BreadcrumbsDeepHierarchy
A 5-level breadcrumb trail for deeply nested content. Use in e-commerce, file browsers, or any UI with several levels of hierarchy.
BreadcrumbsShowcase
A breadcrumb trail showing page hierarchy with linked ancestors and a current page.
BreadcrumbsSupportingVariant
Compare the default and supporting variants side by side. Use the supporting variant in dense UIs like admin panels where the breadcrumb should be subtle.
BreadcrumbsWithIcons
Add icons before breadcrumb labels for quick recognition. Use a home icon on the root item and contextual icons on key sections.

---

# FormLayout

A layout container that arranges form fields with consistent spacing and direction. FormLayout handles where fields go, not state or submission. Wrap it in a <form> for that. Supports vertical (default), horizontal, and horizontal-labels directions, and can be nested to mix them.

**Import:** `import {FormLayout} from '@astryxdesign/core/FormLayout';`

## Anatomy

| Element    | Required | Description                                             |
| ---------- | -------- | ------------------------------------------------------- |
| Form title | No       | Heading that describes the purpose of the form.         |
| Fields     | Yes      | Input components with labels for collecting user data.  |
| Footer     | No       | Contains confirmation buttons such as Submit or Cancel. |

## Best Practices

- **Do:** Stack fields vertically for most forms. It's the easiest to scan top to bottom.
- **Do:** Nest a horizontal FormLayout inside a vertical one when fields naturally pair up, like First Name + Last Name or City + State + ZIP.
- **Do:** Use horizontal-labels for settings pages where labels sit beside their inputs.
- **Don't:** Use FormLayout for form state or submission. It's just layout. Wrap it in a <form> for that.
- **Don't:** Put unrelated fields side by side in a horizontal layout. Save it for fields that belong together.
- **Don't:** Nest horizontal-labels inside another FormLayout. It uses CSS Grid and needs to be the outermost container.

## Props

| Prop        | Type                                                | Default      | Description                                                                                                                                                                           |
| ----------- | --------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `direction` | `'vertical' \| 'horizontal' \| 'horizontal-labels'` | `'vertical'` | Field arrangement. Vertical stacks top-to-bottom, horizontal arranges left-to-right w/ equal flex-grow, horizontal-labels uses CSS Grid w/ labels left of inputs (collapses <=480px). |
| `children`  | `ReactNode`                                         | —            | Form fields to arrange. Accepts Astryx inputs + Field-wrapped custom controls.                                                                                                        |
| `xstyle`    | `StyleXStyles`                                      | —            | StyleX styles for layout customization. Must be stylex.create() value.                                                                                                                |

## Theming

| Component class      | Preferred data attributes | Props     | States |
| -------------------- | ------------------------- | --------- | ------ |
| `astryx-form-layout` | `data-direction`          | direction | —      |

Override in defineTheme:

```ts
components: {
  'form-layout': {
    base: { /* CSS properties */ },
    'direction:value': { /* variant-specific */ },
  },
}
```

Related block templates:

FormLayoutHorizontal
Two fields side by side for naturally paired inputs like first and last name
FormLayoutHorizontalLabels
Settings form with labels placed beside their inputs
FormLayoutMixedControls
Form with different control types: text input, selector, and checkboxes
FormLayoutNested
Address form mixing vertical and horizontal layouts for grouped fields
FormLayoutShowcase
A vertical form layout with text input fields.

---

# Center

Center aligns content to the middle of its container. Use for empty states, loading screens, login forms.

**Import:** `import {Center} from '@astryxdesign/core/Center';`

## Anatomy

| Element   | Required | Description                                                                             |
| --------- | -------- | --------------------------------------------------------------------------------------- |
| Container | Yes      | A flexbox wrapper that aligns its children to the center along the chosen axis.         |
| Content   | Yes      | Any children passed to Center. Typically a card, form, spinner, or empty state message. |

## Best Practices

- **Do:** Use axis="horizontal" or axis="vertical" when you only need one direction. Both axes is the default but not always needed.
- **Do:** Set a height when centering vertically. Center needs a defined height to know what space to center within.
- **Do:** Use isInline to center small elements (icons, badges) within a line of text without breaking text flow.
- **Don't:** Wrap large page sections in Center. Use Layout or AppShell for page-level structure.
- **Don't:** Use Center for horizontal lists of items. Use Stack with hAlign="center" instead.

## Props

| Prop        | Type                                   | Default  | Description                                                                            |
| ----------- | -------------------------------------- | -------- | -------------------------------------------------------------------------------------- |
| `axis`      | `'both' \| 'horizontal' \| 'vertical'` | `'both'` | centering direction(s)                                                                 |
| `width`     | `SizeValue`                            | —        | container width (px or CSS)                                                            |
| `height`    | `SizeValue`                            | —        | container height (px or CSS)                                                           |
| `maxWidth`  | `SizeValue`                            | —        | Maximum container width (px or CSS value).                                             |
| `minHeight` | `SizeValue`                            | —        | Minimum container height (px or CSS value).                                            |
| `isInline`  | `boolean`                              | `false`  | use inline-flex for text/icons                                                         |
| `children`  | `ReactNode`                            | —        | content to center                                                                      |
| `xstyle`    | `StyleXStyles`                         | —        | StyleX styles for layout (margins, positioning, sizing); must be stylex.create() value |

## Theming

| Component class | Preferred data attributes | Props | States |
| --------------- | ------------------------- | ----- | ------ |
| `astryx-center` | `data-axis`               | axis  | —      |

Override in defineTheme:

```ts
components: {
  'center': {
    base: { /* CSS properties */ },
    'axis:value': { /* variant-specific */ },
  },
}
```

Related block templates:

AspectRatioCircleImage
Circular container via shape="ellipse" with ratio={1}, ideal for avatars and profile images.
AspectRatioSquareImage
1:1 square aspect ratio, ideal for avatars and Instagram-style images.
AspectRatioWidescreen
16:9 widescreen aspect ratio wrapping an image.
AspectRatioWithSkeleton
Aspect ratio container with a skeleton loading placeholder.
CenterHorizontal
An editor toolbar with a document title on the left and formatting actions on the right. This shows axis="horizontal", centering in one direction only. Use when content needs to be horizontally centered while other elements are positioned independently around it.
CenterInsideACard
An empty state with an icon, heading, and description centered both vertically and horizontally inside a card. This is the most common use of Center: placing content in the middle of a fixed-height area like a panel, card, or content region. The height prop defines the centering space.
CenterShowcase
Content centered horizontally and vertically inside a fixed-height container.
HoverCardHookUsage
Custom profile preview using useHoverCard with direct trigger and render control.
LayerHookUsage
Low-level anchored overlay rendered with useLayer and a custom surface.
LayoutContentBasic
A scrollable main content area below a fixed header. Use LayoutContent inside Layout to get automatic padding and scroll containment for the primary content.
LayoutFooterActions
A fixed footer with end-aligned action buttons below scrollable content. Use LayoutFooter inside Layout for persistent actions like Save and Cancel.
LayoutHeaderWithActions
A fixed page header with a title and a primary action, above scrollable content. Use LayoutHeader inside Layout for persistent page-level headers.
LayoutPanelNavigation
A fixed-width side panel holding a navigation list next to the main content. Use LayoutPanel in the start or end slot of Layout for sidebars.
MultiSelectorColumnVisibilitySelector
Column visibility toggle with hidden label, search, select-all, and selection count.
MultiSelectorForm
Two multi-selectors in a form with required/optional states.
MultiSelectorSearchableMultiSelector
Multi-select with search filtering and select-all.
MultiSelectorSectionedMultiSelector
Multi-select with options grouped into labeled sections.
NumberInputClearableNumberInput
Number input with a clear button, unit suffix, and min/max constraint
NumberInputRangeNumberInput
Number input with min/max boundaries and a helper description
NumberInputStatuses
Number inputs showing error, warning, and success validation states
NumberInputWithUnits
Number input with a percentage unit suffix and valid range
OverflowListCollapseFromStartList
Overflow list that hides items from the start, keeping the latest visible
PopoverHookUsage
Custom quick-actions popover using usePopover for trigger refs, ARIA attributes, and focus trapping.
ProgressBarCustomFormat
Progress bar with a custom value label showing disk usage in GB.
ProgressBarIndeterminate
Indeterminate progress bar for operations with unknown duration.
ProgressBarSemanticVariants
All semantic color variants stacked vertically.
ProgressBarWithValueLabel
Progress bar with its current percentage displayed.
SelectorClearable
Selector with a clear button to reset the selected value.
SelectorWithSections
Selector with options grouped into labeled sections.
SelectorWithStatus
Selector showing error, warning, and success validation states.
SliderWithStatus
Sliders with error, warning, and success validation states.
SwitchDisabled
Disabled switch with label and description for gated features.
SwitchSettingsPanel
Settings panel with spread-spaced switches in a card.
SwitchWithDescription
Toggle with a label and supporting description text.
SwitchWithStatus
Switches with error, warning, and success validation states.
TooltipActionBarTooltips
Tooltips on an action button bar with contextual descriptions.
TooltipHookUsage
Tooltip using the useTooltip hook for programmatic control.
TypeaheadLimitedResults
Typeahead with a capped dropdown showing at most three results.
TypeaheadSearchField
Search input with icon and suggestions on focus.
TypeaheadWithHelperText
Typeahead with a description below the label.
TypeaheadWithValidation
Typeahead with an error validation message.
TypeaheadItemBasic
A typeahead whose results are rendered with TypeaheadItem, adding a secondary description below each label. Use inside renderItem to keep custom results visually consistent.

---

# InputGroup

InputGroup connects an input with addons. Use for URL fields, currency inputs, search with actions.

**Import:** `import {InputGroup} from '@astryxdesign/core/InputGroup';`

## Anatomy

| Element        | Required | Description                                                                                                   |
| -------------- | -------- | ------------------------------------------------------------------------------------------------------------- |
| Label          | Yes      | Text above the group.                                                                                         |
| Prefix addon   | No       | Content before the input (text, icon, or button).                                                             |
| Input          | Yes      | The main input element (TextInput, NumberInput, TimeInput, DateInput, Typeahead, Selector, or MultiSelector). |
| Suffix addon   | No       | Content after the input (text, icon, or button).                                                              |
| Status message | No       | An error, warning, or success message below the group.                                                        |

## Best Practices

- **Do:** Use text addons to show units, prefixes, or suffixes that clarify input format (e.g. "$", "kg", "https://").
- **Do:** Use InputGroupText for static prefixes/suffixes like "$", "kg", or "https://".
- **Do:** Use InputGroup with compatible single-line inputs: TextInput, NumberInput, TimeInput, DateInput, Typeahead, Selector, and MultiSelector.
- **Do:** Keep each inner input's label specific; grouped inputs combine the group label with their own label and inherit group description/status.
- **Don't:** Don't put multiple text inputs in one group; use separate fields instead.
- **Don't:** Don't use InputGroup for unrelated inputs; it's for a single input with decorations.
- **Don't:** Don't use InputGroup with TextArea, Slider, Switch, CheckboxInput, or RadioList.

## Props

| Prop            | Type                                                          | Default | Description                                                                                                                                       |
| --------------- | ------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `children`      | `ReactNode`                                                   | —       | InputGroupText and compatible input children: TextInput, NumberInput, TimeInput, DateInput, Typeahead, Selector, or MultiSelector. **(required)** |
| `label`         | `string`                                                      | —       | Accessible label for the group. **(required)**                                                                                                    |
| `isLabelHidden` | `boolean`                                                     | `false` | Visually hide the label.                                                                                                                          |
| `description`   | `string`                                                      | —       | Helper text between label and input group.                                                                                                        |
| `isDisabled`    | `boolean`                                                     | `false` | Disable the entire group.                                                                                                                         |
| `isOptional`    | `boolean`                                                     | `false` | Show "(optional)" indicator.                                                                                                                      |
| `isRequired`    | `boolean`                                                     | `false` | Mark the field as required.                                                                                                                       |
| `size`          | `'sm' \| 'md' \| 'lg'`                                        | `'md'`  | Default size for inputs in the group.                                                                                                             |
| `status`        | `{type: 'warning' \| 'error' \| 'success', message?: string}` | —       | Status indicator applied to the group border.                                                                                                     |
| `labelTooltip`  | `string`                                                      | —       | Tooltip text at the end of the label.                                                                                                             |
| `xstyle`        | `StyleXStyles`                                                | —       | StyleX styles for layout customization.                                                                                                           |
| `data-testid`   | `string`                                                      | —       | Test selector.                                                                                                                                    |

## Components

### InputGroupText

See `npx astryx component InputGroupText` for props and usage.

## Theming

| Component class           | Preferred data attributes  | Props        | States |
| ------------------------- | -------------------------- | ------------ | ------ |
| `astryx-input-group`      | `data-size`, `data-status` | size, status | —      |
| `astryx-input-group-text` | —                          | —            | —      |

Override in defineTheme:

```ts
components: {
  'input-group': {
    base: { /* CSS properties */ },
    'size:value': { /* variant-specific */ },
  },
  'input-group-text': {
    base: { /* CSS properties */ },
  },
}
```

Related block templates:

InputGroupBasic
A currency field with static prefix and suffix addons around a TextInput. Use InputGroupText to clarify units or input format.
InputGroupShowcase

---

# FieldStatus

Validation feedback message for fields/custom controls. Supports error, warning, success and attached/detached variants.

**Import:** `import {FieldStatus} from '@astryxdesign/core/FieldStatus';`

## Best Practices

- **Do:** Use attached status below bordered inputs when message belongs to that input.
- **Do:** Use detached status for checkboxes, switches, and custom controls where overlap is visually awkward.
- **Don't:** Use FieldStatus for general alerts or page-level notices; use Banner or Toast instead.

## Props

| Prop      | Type                                | Default      | Description                                      |
| --------- | ----------------------------------- | ------------ | ------------------------------------------------ |
| `type`    | `'error' \| 'warning' \| 'success'` | —            | error/warning/success status tone **(required)** |
| `message` | `string`                            | —            | visible validation feedback text **(required)**  |
| `id`      | `string`                            | —            | id for aria-describedby association              |
| `variant` | `'attached' \| 'detached'`          | `'attached'` | attached overlaps input; detached floats below   |

## Theming

| Component class       | Preferred data attributes   | Props              | States |
| --------------------- | --------------------------- | ------------------ | ------ |
| `astryx-field-status` | `data-type`, `data-variant` | attached, detached | —      |

Override in defineTheme:

```ts
components: {
  'field-status': {
    base: { /* CSS properties */ },
    'type:value': { /* variant-specific */ },
  },
}
```

Related block templates:

FieldStatusBasic
Detached error and success messages for validation feedback. Use below checkboxes, switches, or custom controls where an attached status would overlap.
FieldStatusShowcase
Field status messages in error, warning, and success states with attached and detached variants.

---

# VisuallyHidden

Renders content in the accessibility tree while hiding it visually. Use for accessible names on icon-only controls, aria-live announcement regions, and supplementary screen-reader context.

**Import:** `import {VisuallyHidden} from '@astryxdesign/core/VisuallyHidden';`

## Best Practices

- **Do:** Use to give icon-only buttons and controls an accessible name that screen readers announce.
- **Do:** Render as a block element (as="div") with aria-live to announce dynamic updates like drag-and-drop or result counts.
- **Don't:** Use it to hide content from everyone; it stays in the accessibility tree; use conditional rendering or `hidden` to remove content entirely.
- **Don't:** Put interactive controls inside it; the content is not visible and cannot receive pointer input.

## Props

| Prop       | Type          | Default  | Description                                           |
| ---------- | ------------- | -------- | ----------------------------------------------------- |
| `children` | `ReactNode`   | —        | content exposed to AT while visually hidden           |
| `as`       | `ElementType` | `'span'` | HTML tag to render as; block element for live regions |

Related block templates:

VisuallyHiddenLiveRegion
A polite aria-live region announces visual-only state changes to assistive technology.
VisuallyHiddenShowcase
VisuallyHiddenStructuralHeading
Give a visually implicit section an accessible name so screen-reader users can navigate to it.
VisuallyHiddenSupplementaryContext
Add screen-reader-only context to terse visual data, like spelling out what a trend arrow means.

---

# Thumbnail

Compact square image preview. Shimmer while uploading, image on success, placeholder when empty. Use in chat composers, file lists, or small media previews.

**Import:** `import {Thumbnail} from '@astryxdesign/core/Thumbnail';`

## Anatomy

| Element        | Required | Description                                                                                                                                 |
| -------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Image          | No       | The preview image, displayed as a square with cover fit.                                                                                    |
| Placeholder    | No       | An image silhouette icon shown when no src is provided.                                                                                     |
| Remove button  | No       | An overlaid close button in the top-right corner. Appears when onRemove is set. Uses APCA luminance detection to stay visible on any image. |
| Upload overlay | No       | A semi-transparent overlay with a spinner, shown when isLoading is true and a src preview is available.                                     |
| Skeleton       | No       | A shimmer animation shown when isLoading is true and no src is set.                                                                         |

## Best Practices

- **Do:** Always set label (file name) for a11y; powers screen reader announce + hover tooltip.
- **Do:** isLoading w/o src → skeleton; isLoading w/ src → spinner overlay. Two distinct loading states.
- **Do:** onClick adds button semantics + hover shadow; pair with lightbox for full preview.
- **Don't:** Don't use for non-image files (PDF, xlsx); use file attachment component with icon instead.
- **Don't:** Don't omit alt when src present; screen readers need image content description, not just label.

## Props

| Prop          | Type                            | Default | Description                                                     |
| ------------- | ------------------------------- | ------- | --------------------------------------------------------------- |
| `src`         | `string`                        | —       | Image source URL.                                               |
| `alt`         | `string`                        | —       | Alt text for image.                                             |
| `label`       | `string`                        | —       | Accessible label (file name). Tooltip on hover, aria-label.     |
| `onRemove`    | `(e: React.MouseEvent) => void` | —       | (e) => void. Overlaid remove button callback.                   |
| `onClick`     | `(e: React.MouseEvent) => void` | —       | (e) => void. Adds button semantics + hover shadow.              |
| `isLoading`   | `boolean`                       | `false` | Skeleton (no src) or upload overlay (with src). Default: false. |
| `isDisabled`  | `boolean`                       | `false` | Disabled state. Default: false.                                 |
| `xstyle`      | `StyleXStyles`                  | —       | stylex.create() for layout.                                     |
| `className`   | `string`                        | —       | CSS class. Prefer xstyle.                                       |
| `style`       | `CSSProperties`                 | —       | Inline styles. Prefer xstyle.                                   |
| `data-testid` | `string`                        | —       | Test selector.                                                  |

## Theming

| Component class    | Preferred data attributes | Props | States |
| ------------------ | ------------------------- | ----- | ------ |
| `astryx-thumbnail` | —                         | —     | —      |

Override in defineTheme:

```ts
components: {
  'thumbnail': {
    base: { /* CSS properties */ },
  },
}
```

Related block templates:

ChatComposerDrawerAttachments
Drawer with two rows: a scrollable carousel of image thumbnails and a row of removable file tokens. Omit count to keep the drawer always expanded.
LightboxGallery
A thumbnail grid that opens a fullscreen gallery. Clicking any thumbnail opens the lightbox at that index. Prev/next navigation lets users browse all images without closing.
LightboxZoom
A lightbox with zoom and pan enabled. Double-click the image to zoom in; drag to pan around. Double-click again or use the close button to exit.
ThumbnailDisabled
Thumbnails in the disabled state with reduced opacity. The remove button and click handler are suppressed when disabled.
ThumbnailGallery
A row of clickable thumbnails with labels that open a detail view. Use for image attachment lists where users need to preview and manage uploads.
ThumbnailRemovable
Thumbnails with a remove button overlay. The close button uses APCA luminance detection to stay visible on both dark and light images.
ThumbnailShowcase
A thumbnail with an image and label.
ThumbnailStates
All visual states side by side: image loaded, placeholder, skeleton loading, and upload overlay. Demonstrates the full lifecycle of a thumbnail from empty to loaded.

---
