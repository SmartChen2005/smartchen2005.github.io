# Build Portfolio Project Page — VR for Skill Learning

## 1. Objective

Create a new project page for my personal portfolio titled **VR for Skill Learning**.

This is an ongoing collection of VR projects exploring how immersive environments can support practical skill learning through physical interaction, procedural guidance, spatial navigation, and embodied experiences.

Currently, the collection includes two projects:

- **Assignment 1 — Wheel Removal Training**
- **Assignment 2 — Garage Ready**

Additional projects may be added in the future, potentially covering completely different skills.

**Important:** This is NOT an automotive-themed website. Automotive training happens to be the subject of the first two projects, but the overall visual identity and page structure must remain universal and adaptable to other forms of VR skill learning.

Create one cohesive parent project page containing both assignments, not two separate project pages.

## 2. Visual Direction

Use a **Modernist Editorial / Bauhaus-inspired / Swiss Graphic Design** aesthetic.

The overall design should feel like a contemporary design portfolio or experimental design publication.

Visual characteristics:

- Clean, precise typography
- Strong editorial grid system
- Generous whitespace and intentional composition
- Abstract geometric shapes and minimal graphic elements
- Carefully balanced asymmetrical layouts
- Thin lines, small numbered labels, and subtle visual details
- A restrained palette of off-white, charcoal, cobalt blue, orange, and occasional muted accent colors
- Subtle, thoughtful animations and microinteractions
- Strong visual hierarchy and elegant responsive layouts

Use the reference image only as inspiration for its **art direction, geometric abstraction, composition, and color sensibility**.

Do NOT recreate the physical room, cube, gallery installation, or objects shown in the reference.

Avoid:

- Generic SaaS landing-page aesthetics
- Oversized rounded cards everywhere
- Excessive gradients and glassmorphism
- Cyberpunk/neon VR visuals
- Automotive branding or decorative car imagery
- Heavy 3D environments
- Excessive scroll effects or animations
- Overly technical dashboards

The page should feel artistic, minimal, confident, and carefully designed.

## 3. Page Structure

### Section 00 — Hero

Main title:

**VR for Skill Learning**

Subtitle:

*Exploring how virtual reality can support practical skill learning through physical interaction, procedural guidance, and spatial exploration.*

Include small editorial metadata such as:

- VR / Interaction Design
- 2026 — Ongoing
- 02 Projects

Use large expressive typography and a restrained abstract geometric composition.

The hero should not depict a car or garage. Its visual identity should represent skill learning and interaction more broadly.

Subtle geometry animations or mouse-driven motion are welcome, but keep them understated.

### Section 01 — Wheel Removal Training

Label:

**01 / Procedural Task Training**

Title:

**Wheel Removal Training**

Description:

A VR procedural training experience that teaches the sequence of removing a vehicle wheel through direct interaction with tools, guided actions, and immediate feedback.

Use the attached Assignment 1 design document as the primary source for all technical and educational details.

Embed the YouTube demonstration directly into the page:

https://youtu.be/oPTZlXH334Q

Use a clean 16:9 player integrated into the editorial layout.

#### Small Interactive Element — Procedure Sequence

Create ONE polished, lightweight interactive diagram illustrating the four main steps:

1. Position the jack
2. Loosen the five lug nuts
3. Raise the vehicle
4. Remove and store the wheel

Allow users to click or hover to move between steps.

The diagram can use a simplified wheel illustration, line art, basic SVG geometry, and a small active-step indicator.

For the lug-nut step, consider subtly showing the star-pattern guidance described in the design document.

Use smooth, minimal transitions.

**Important:** This interaction should be a small supporting detail, not a large simulation or the main attraction of the section.

Include a clearly visible link to the original Assignment 1 design document.

Optionally show a very short expandable design note highlighting the interaction design, guidance, or error-feedback system.

### Section 02 — Garage Ready

Label:

**02 / Spatial Navigation, Teleportation and Scene Switching**

Title:

**Garage Ready**

Description:

A VR learning experience where users navigate between a home garage and an auto parts store, locate supplies, organize equipment, and reuse tools across multiple preparation tasks.

Use the attached Assignment 2 design document as the primary source for the exact design details.

Embed the YouTube demonstration directly into the page:

https://youtu.be/BIA2i71Cy2g

Use the same overall video presentation language as Assignment 1 for consistency.

#### Small Interactive Element — Spatial Navigation

Create ONE lightweight interactive graphic demonstrating the relationship between the two environments:

- Home Garage
- Auto Parts Store

Clicking or hovering between them can update a minimal diagram and a short explanatory sentence.

For example:

**Auto Parts Store:** Navigate departments and collect required supplies.

**Home Garage:** Store purchases, retrieve reusable tools, and prepare the workbench.

The interaction can use a minimal schematic, an abstract floor-plan diagram, or connected geometric shapes.

It does not need to replicate the exact Unity level geometry.

**Important:** Keep the interaction small, elegant, and secondary to the project video and description.

Include a clearly visible link to the original Assignment 2 design document.

### Section 03 — Closing / Future Development

End with a concise reflection on the broader theme of VR for skill learning.

Emphasize how different VR interaction systems can support different aspects of learning, such as procedural guidance, spatial familiarity, and hands-on task preparation.

Do not claim proven learning improvements without supporting evaluation data.

Do not fabricate user testing, performance metrics, or research results.

The page should be extendable to future assignments without redesigning the overall architecture.

Avoid unnecessary placeholder projects or elaborate coming-soon sections.

## 4. Presentation of Design Documents

Each assignment has an attached PDF design document.

Make the documents easy to access, but do not turn the page into a long PDF viewer.

Use a compact editorial document link or small document preview with appropriate metadata.

Examples:

**VIEW DESIGN DOCUMENT ↗**

or

**A1 / DESIGN DOCUMENT — PDF ↗**

The links must open the actual PDFs, not placeholders.

Ensure the PDF assets are stored in an appropriate public-accessible project directory and that their links work in production.

You may extract a few important details from the documents for short explanatory annotations, but avoid duplicating the full documents as webpage text.

## 5. Motion and Interaction

Motion should support the editorial design, not dominate it.

Recommended:

- Subtle entrance transitions
- Refined hover states
- Small geometric animations
- Smooth state changes in the two diagrams
- Minimal section navigation indicators

Avoid:

- Scroll hijacking
- Heavy animation libraries unless justified
- Elaborate 3D scenes
- Multiple competing interactive elements
- Unnecessary loading screens
- Auto-playing audio

Respect `prefers-reduced-motion`.

## 6. Technical Requirements

- Inspect the existing portfolio repository before implementation.
- Follow the existing framework, routing system, layout structure, and coding conventions.
- Add this page as a new project within the existing Projects section.
- Preserve the existing portfolio design language where appropriate, while giving this project its own visual identity.
- Make the page fully responsive on desktop, tablet, and mobile.
- Use accessible, keyboard-operable interactive elements.
- Embed both YouTube videos with responsive 16:9 sizing.
- Use real PDF assets supplied with the task.
- Prefer lightweight SVG, CSS, and existing project dependencies.
- Avoid unnecessary packages and external assets.
- Keep project data modular so additional assignments can be added later.
- Do not modify unrelated pages or components.

## 7. Content and Design Priorities

The most important elements, in order:

1. A beautiful, cohesive project page with a distinctive modernist editorial aesthetic.
2. Clear presentation of the overall VR for Skill Learning concept.
3. Two embedded YouTube demonstration videos.
4. Concise and accurate descriptions of each assignment.
5. Easy access to both original design documents.
6. One small, meaningful interactive graphic per assignment.
7. Subtle, polished animations and responsive behavior.

**The two small interactions should enhance the presentation without overshadowing the videos or the actual projects.**

Use the provided documents as authoritative sources and do not invent implementation details, assessment results, or learning outcomes.

## 8. Implementation Process

First, inspect the existing repository and identify the correct location for the new page and its project entry.

Then implement the page using the requirements above.

Make reasonable design decisions independently rather than stopping for approval of every visual detail.

After implementation:

- Verify that both YouTube embeds work.
- Verify that both PDF links resolve.
- Check desktop and mobile layouts.
- Verify both small interactions.
- Check for visual inconsistencies and overflow.
- Run any existing build, lint, or relevant validation commands.
- Summarize the files changed and any remaining limitations.

The final result should feel like a thoughtfully art-directed design portfolio project, not a course assignment webpage or generic product landing page.