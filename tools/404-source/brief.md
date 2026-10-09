
# Project: Interactive 404 — Site Under Construction

Build a fully functional, interactive 404 webpage inspired by the reference photograph I have provided.

## 1. Core Concept

Create a photorealistic, slightly surreal 404 page that looks like a real indoor space covered with black-and-white checkerboard floor tiles.

At the center of the scene is a yellow folding A-frame caution sign, similar to the cleaning sign in my reference photograph.

The sign reads:

404
SITE UNDER CONSTRUCTION

Rather than presenting a conventional error page, the entire webpage should feel like a physical space that is literally under construction or being cleaned.

Users should be able to drag the sign around, spawn additional construction and caution objects, and play with their arrangement.

The experience should feel like a small interactive art installation rather than a typical website.

## 2. Visual Direction

The reference photograph is the primary visual reference. Reproduce its visual language as closely as possible.

Key characteristics:
- Small black-and-white square ceramic floor tiles
- Strong, physically believable perspective
- Warm, slightly dim indoor lighting
- Yellow plastic folding caution signs
- Subtle scratches, dirt, imperfections, and wear
- Realistic material textures
- Contact shadows and ambient occlusion
- A slightly mundane, liminal, almost accidentally cinematic atmosphere

Avoid:
- Flat vector illustrations
- Cartoon aesthetics
- Bright, overly saturated colors
- Conventional landing-page layouts
- Excessive glassmorphism
- Generic gradients or decorative UI elements

The scene should feel grounded, photographic, and physically believable.

## 3. Spatial Environment

The entire viewport should function as a perspective-based 3D environment.

### Checkerboard Floor

Create an expansive black-and-white tiled floor resembling the reference image.

Requirements:
- Strong perspective and depth
- Individual square tiles should have realistic proportions
- Slightly imperfect ceramic surfaces
- Visible grout lines
- Subtle roughness and realistic light reflections
- Floor should extend beyond the viewport
- Objects must appear physically grounded on the floor

CRITICAL: Do not simply use a flat checkerboard background image.

The floor must be a genuine perspective-correct surface that supports placing and moving three-dimensional objects.

### Camera

Use a fixed or slightly interactive perspective camera.

The initial camera angle should resemble looking down into the tiled space from a standing person's viewpoint, similar to the photograph.

Objects nearer the camera should appear larger, and objects farther away should appear smaller.

The scene should maintain a consistent spatial coordinate system.

A very subtle camera movement or parallax effect is acceptable, but avoid excessive motion.

## 4. Primary Object: Yellow A-Frame Caution Sign

Create a realistic yellow folding plastic caution sign.

Reference:
The yellow "REST ROOMS BEING CLEANED" A-frame sign in the provided photograph.

Geometry:
- Two angled panels forming an A-frame
- Open triangular profile when viewed from the side
- Rounded rectangular handle cutout near the top
- Realistic plastic thickness
- Physically plausible proportions
- Stable contact with the floor

Material:
- Industrial yellow plastic
- Slight roughness
- Subtle dirt, scratches, and signs of use
- Realistic surface lighting
- Dark printed typography

Text printed on the front:

404
SITE UNDER
CONSTRUCTION

Typography should resemble industrial warning signage: bold, condensed, black sans-serif lettering.

IMPORTANT: The text must appear printed directly onto the sign's surface, following its geometry and perspective. It must not appear as floating HTML text.

The sign should cast a realistic shadow on the tiled floor.

## 5. Interaction: Drag and Reposition

Users should be able to click and drag any caution sign or construction object.

Requirements:
- Smooth mouse dragging
- Raycast or equivalent interaction with the floor plane
- Objects move along the floor, not freely through the screen
- Preserve correct perspective and physical scale
- Objects must remain upright
- Maintain realistic grounding and shadows
- Prevent objects from intersecting or overlapping
- Provide subtle visual feedback when an object is selected

Dragging should feel like physically rearranging objects in a real environment.

Objects should stop or slide naturally when encountering another object, rather than clipping through it.

## 6. Interaction: Spawn More Objects

Include a minimal floating UI control that allows users to add more construction-related objects to the scene.

Possible button label:

"+ ADD OBJECTS"

Clicking it should spawn a collection of randomized objects onto the floor.

Create several visually distinct types of objects, including:

1. Yellow A-frame caution signs
2. Yellow wet floor signs
3. Yellow/orange traffic cones
4. Small portable construction barriers
5. Folding maintenance signs
6. Floor cleaning warning markers
7. Other believable temporary warning or maintenance props

All objects should belong to the same realistic visual world.

Avoid overly stylized or toy-like geometry.

### Spawning Behavior

Every click should:
- Generate several objects
- Randomize their positions
- Randomize their orientations
- Introduce subtle variations in size and appearance
- Ensure objects never intersect each other
- Keep objects within the usable scene boundaries

Objects should appear with a subtle, satisfying entrance animation.

For example, they can drop a short distance onto the floor with a little bounce and settle into place.

If an object cannot be placed without overlapping others, find another valid position or skip spawning it.

Do not allow infinite overlapping objects.

## 7. Spatial Collision and Object Placement

Implement real spatial placement logic.

Each object should have a collision boundary or approximate 3D footprint.

Requirements:
- No intersecting objects
- No overlapping signs
- No objects floating above the floor
- No objects sinking into the floor
- Reasonable spacing between objects
- Collision-aware dragging
- Collision-aware spawning

Use a proper world-coordinate system instead of treating positions as 2D screen coordinates.

A lightweight collision implementation is sufficient; a full physics engine is optional.

## 8. Additional Interactions

Add a few subtle interactions that make the page more playful.

### Randomize Layout

Provide a small button labeled:

"SHUFFLE"

When clicked:
- Rearrange all secondary objects
- Randomize their positions and rotations
- Preserve collision constraints
- Animate the transition smoothly

### Clear Scene

Provide a button labeled:

"CLEAR"

When clicked:
- Remove all secondary objects
- Restore the original main caution sign
- Return to the initial composition

### Optional Rotation

Allow the user to rotate a selected sign using a simple gesture or keyboard shortcut.

Keep this interaction intuitive and unobtrusive.

## 9. UI and Typography

Keep the interface extremely minimal.

The environment itself should be the main visual experience.

Avoid large floating cards or conventional navigation bars.

Suggested controls:
- + ADD OBJECTS
- SHUFFLE
- CLEAR

Place these controls discreetly near a corner or edge of the viewport.

Use restrained typography inspired by industrial signage and Swiss graphic design.

The primary "404 SITE UNDER CONSTRUCTION" message belongs on the physical sign, not in a large HTML heading floating over the scene.

Optional small secondary text:

"THIS AREA IS TEMPORARILY UNAVAILABLE."

Include a subtle "BACK TO HOME" link.

The UI should not distract from the physical environment.

## 10. Technical Implementation

Prioritize the visual result and interaction quality.

Preferred stack:
- React
- Three.js
- React Three Fiber
- Drei
- CSS for minimal interface elements

Use actual 3D geometry for the floor and caution signs.

Avoid relying exclusively on CSS perspective or 2D sprites.

Procedural geometry is acceptable, but the result must look convincingly three-dimensional.

Use:
- PerspectiveCamera
- Plane geometry for the floor
- Procedural or textured tiles
- Physically based materials
- Directional and ambient lighting
- Soft shadows
- Raycasting for drag interactions
- Collision-aware placement algorithms

Use efficient rendering techniques where appropriate.

### Asset Quality

Do not let the use of primitive geometry compromise visual quality.

For realistic props, consider creating reusable low-poly but visually convincing models with proper materials, bevels, thickness, and textures.

If externally sourced assets are required, use appropriate openly licensed assets and document their sources.

The supplied image should serve as the visual reference, not simply be pasted into the page as a background.

## 11. Responsive Behavior

Desktop is the primary target.

The design should also work on mobile devices.

On mobile:
- Support touch dragging
- Adjust the camera composition
- Ensure controls remain usable
- Maintain perspective
- Optimize rendering performance

Do not sacrifice the spatial experience by replacing the entire scene with a flat mobile layout.

## 12. Motion and Atmosphere

The experience should feel tactile, grounded, and slightly playful.

Motion principles:
- Subtle
- Physically plausible
- Smooth
- Responsive
- Not exaggerated

Use gentle easing and short animations.

Objects can settle after spawning, but avoid cartoon-style bouncing.

The overall scene should feel quiet and atmospheric.

## 13. Implementation Priorities

Follow this order:

1. Establish a convincing perspective-based tiled environment.
2. Create one visually accurate yellow A-frame caution sign.
3. Add realistic materials, lighting, and contact shadows.
4. Implement spatially accurate dragging.
5. Implement additional object types.
6. Add collision-aware spawning.
7. Add shuffle and clear interactions.
8. Refine animations, materials, and typography.
9. Polish responsive behavior and performance.

Visual fidelity is especially important.

If there is a tradeoff between adding many features and achieving a convincing visual result, prioritize the visual result.

## 14. Final Design Goal

The finished page should look like a photograph of a mundane indoor maintenance area that has somehow become interactive.

A black-and-white checkerboard tiled floor stretches into perspective.

A worn yellow caution sign stands on the floor.

It reads:

404
SITE UNDER CONSTRUCTION

The user can pick it up, move it around, summon dozens of other construction-related signs and barriers, and rearrange the whole scene.

All objects exist in the same believable three-dimensional environment.

The tone should be subtly humorous, visually memorable, slightly absurd, and highly tactile.

This should feel like a small interactive digital artwork disguised as a 404 error page.

Build the working implementation, not just a static mockup.
