# GitHub Repository Research Findings

## Executive Summary

Successfully researched and added GitHub repository information for **33 out of 37 registries** (89% success rate) and **all 5 tools** (100% success rate).

## Methodology

1. Searched GitHub using repository search API
2. Verified official websites for GitHub links
3. Cross-referenced with PR author information when available
4. Validated repository ownership and activity

## Detailed Results

### Registries Successfully Updated (33)

The following registries now have `github_url` and `github_profile` fields:

1. **Coss UI** → `cosscom/coss`
2. **Aceternity UI** → `manuarora700/ui.aceternity`
3. **shadcn-glass-ui** → `Yhooi2/shadcn-glass-ui-library`
4. **Shadcn UI Blocks** → `shadcnblockscom/shadcn-ui-blocks`
5. **Pure UI** → `MusKRI/pure-ui`
6. **Shadcn Blocks** → `shadcnblocks/kibo`
7. **Algolia SiteSearch** → `algolia/sitesearch`
8. **StyleGlide** → `shane-downes/styleglide`
9. **Neobrutalism components** → `ekmas/neobrutalism-components`
10. **kokonut/ui** → `kokonut-labs/kokonutui`
11. **Magic UI** → `magicuidesign/magicui`
12. **Cult UI** → `nolly-studio/cult-ui`
13. **Kibo UI** → `shadcnblocks/kibo`
14. **ReUI** → `keenthemes/reui`
15. **RetroUI** → `Logging-Studio/RetroUI`
16. **Skiper UI** → `Gurvinder-Singh02/legacy-skiper-ui`
17. **JollyUI** → `jolbol1/jolly-ui`
18. **React Bits** → `DavidHDev/react-bits` (34k+ stars)
19. **WDS Shadcn Registry** → `WebDevSimplified/wds-shadcn-registry`
20. **Animate UI** → `imskyleen/animate-ui`
21. **AI Elements** → `vercel/ai` (Vercel's AI SDK)
22. **Dice UI** → `sadmann7/diceui`
23. **ElevenLabs UI** → `elevenlabs/ui`
24. **8bitcn** → `TheOrcDev/8bitcn-ui`
25. **pqoqubbw/icons** → `pqoqubbw/icons`
26. **Intent UI** → `intentui/intentui`
27. **Design Intent UI** → `intentui/intentui` (same as Intent UI)
28. **Eldora UI** → `karthikmudunuri/eldoraui`
29. **Shadix UI** → `apix-js/shadix-ui`
30. **HextaUI** → `preetsuthar17/HextaUI`
31. **Manifest UI** → `mnfst/manifest`
32. **heroicons-animated** → `Aniket-508/heroicons-animated`
33. **shadcn/ui** → `shadcn-ui/ui` (already existed)

### Tools Successfully Updated (5)

All tools now have GitHub information:

1. **Pastecn** → `rbadillap/pastecn` (already existed)
2. **Tweakcn** → `jnsahaj/tweakcn`
3. **Shadcn Form Builder** → `hasanharman/form-builder`
4. **StyleGlide** → `shane-downes/styleglide`
5. **Algolia SiteSearch** → `algolia/sitesearch`

### Registries Without GitHub Repository (4)

The following registries could not be linked to public GitHub repositories. Per the issue requirements, they were left without changes:

1. **Shadcn Form Builder** (https://shadcn-form.com/)
   - The website doesn't have an associated registry repository
   - Note: A form-builder repo exists for the tool version

2. **Shadcn.IO** (https://shadcn.io/)
   - No dedicated GitHub repository found
   - May be a community aggregator or related to main shadcn/ui

3. **shadcn/studio** (https://shadcnstudio.com/)
   - No official repository found
   - Appears to be a commercial/proprietary offering

4. **useLayouts** (https://uselayouts.com)
   - No public repository found
   - Likely a premium/proprietary product

## Notable Findings

### Duplicate Projects
Some registries share the same repository:
- **Shadcn Blocks** and **Kibo UI** → both use `shadcnblocks/kibo`
- **Intent UI** and **Design Intent UI** → both use `intentui/intentui`

### High-Profile Projects
- **React Bits** (`DavidHDev/react-bits`) - 34,435+ stars
- **AI Elements** - Part of Vercel's official AI SDK

### PR Author Correlation
Many repositories were confirmed by matching with PR authors who submitted them to the directory:
- `Aniket-508` submitted heroicons-animated PR and owns the repo
- `WebDevSimplified` submitted WDS Shadcn Registry PR and owns the repo
- `preetsuthar17` submitted HextaUI PR and owns the repo
- And many others...

## Validation

All changes have been validated:
- ✅ JSON syntax is valid
- ✅ All GitHub URLs follow the format `https://github.com/{owner}/{repo}`
- ✅ All GitHub profile images follow the format `https://github.com/{username}.png`
- ✅ TypeScript type compatibility confirmed
- ✅ No security vulnerabilities introduced

## Impact

### UI Changes
- Entries with GitHub information will now display:
  - GitHub avatar next to the registry/tool name
  - GitHub icon button linking to the repository
  
- Entries without GitHub information will continue to display:
  - Generic package icon
  - No GitHub link

This provides users with quick access to source code and better attribution for creators.
