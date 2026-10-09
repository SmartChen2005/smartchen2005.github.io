# Revision Prompt — Interactive 404 Page (Preserve Existing Objects and Scene)

Revise the current implementation of my interactive 404 page.

This is a targeted refinement pass. Do NOT redesign the project from scratch.

## Highest Priority Rule

Preserve the current scene objects and their modeling.

I am NOT satisfied when the model keeps redesigning or rebuilding the props.  
So for this revision:

- do NOT remodel the signs
- do NOT redesign the cones
- do NOT redesign the barriers
- do NOT redesign the posts
- do NOT redesign the existing object family
- do NOT change the general object look
- do NOT reinterpret the environment style

Keep the current object models and the current scene structure as much as possible.

This revision should mainly focus on:
1. removing the sink
2. updating the text content on objects
3. adjusting interaction logic
4. improving physical behavior
5. refining the UI only

---

## 1. Scene Direction

Keep the existing scene.

Do not redesign the environment.

The current checkerboard floor is fine.  
The walls are also fine.  
The room-like enclosure is fine.

Do not apply Bauhaus styling to the scene itself.

### Only scene change:
- remove the sink

The sink should be deleted entirely.

Other than removing the sink, the scene should remain as it currently is.

Do not add new architectural features.  
Do not restyle the walls.  
Do not change the floor style.  
Do not redesign the room.  
Do not turn the environment into something more abstract.

---

## 2. Preserve Existing Objects

Keep the existing object models as they are.

This is extremely important.

Do not modify the geometry or modeling of:
- warning signs
- cones
- barriers
- posts
- plus-sign objects if any
- other existing props

Do not redesign them in a more Bauhaus way.  
Do not simplify them.  
Do not replace them with new shapes.  
Do not rebuild them from scratch.

The only thing that should change on these existing props is the **text content**.

Their form should remain the same.

---

## 3. Text Content Changes Only

The logic for rewriting the text remains the same as before.

Replace the wording on the signs so that all object text belongs to the semantic world of:
- 404
- Site Under Construction
- Maintenance
- Caution
- No Content
- Page Not Found
- Access Limited
- Content Missing
- Under Maintenance
- This Area Is Temporarily Unavailable

### Allowed text examples:
- 404
- SITE UNDER CONSTRUCTION
- MAINTENANCE
- CAUTION
- NO CONTENT
- PAGE NOT FOUND
- ACCESS LIMITED
- CONTENT MISSING
- UNDER MAINTENANCE
- THIS AREA IS TEMPORARILY UNAVAILABLE

### Important:
Do NOT use text such as:
- WET FLOOR
- CLEANING
- REST ROOMS
- generic janitor or restroom language

So:
- keep the existing objects
- keep their current forms
- only update the written content on them

The text system should still communicate a 404 / unavailable / under construction webpage concept.

---

## 4. Bauhaus Style Applies Only to the UI

The Bauhaus or modernist design direction should now apply ONLY to the UI.

Do NOT use Bauhaus to redesign the scene or the 3D objects.

Only the interface layer should be influenced by Bauhaus / Swiss / modernist design.

### UI direction:
- clean
- bold
- minimal
- modernist
- typographically strong
- structured
- more deliberate
- less game-editor-like

The UI should feel designed and intentional.

This applies to:
- fonts
- buttons
- spacing
- hierarchy
- alignment
- layout of controls

The UI can take inspiration from Bauhaus / Swiss graphic design, but the scene itself should remain unchanged.

---

## 5. Use the Current Improved UI as Reference

The current UI in the latest version is actually better.

Use this current UI as a reference for the UI direction.

That means:
- the cleaner button treatment is better
- the current overall UI feeling is better
- continue in this direction

However, I will revert other scene/content changes back to the earlier version.

So for this new revision:
- preserve the earlier scene/object setup
- but use the newer UI quality/direction as the reference for interface refinement

In other words:
**UI can follow the latest improved version, but scene/object styling should stay with the earlier version.**

---

## 6. Keep Back to Home, Shuffle, Clear

Keep these UI functions:
- BACK TO HOME
- SHUFFLE
- CLEAR

They can remain as interface buttons.

Style them with the refined UI system.

They should look clean and intentional.

---

## 7. Remove the Old "Add Objects" Button

Do NOT make “Add Objects” a separate scene object.  
Do NOT make it a visible physical plus-sign object in the environment.  
Do NOT keep it as a standalone top-level button either, unless needed only as fallback during development.

Instead, change the spawning logic:

### New rule:
Clicking an existing object in the scene should spawn a new object.

That means:
- every time the user clicks on an object that already exists in the scene
- one new object should be added/spawned

This replaces the previous add-object interaction.

So the add-object mechanic is now embedded into object interaction itself.

### Desired behavior:
- user clicks an existing sign / cone / barrier / post / prop
- a new object gets added to the scene
- new objects should still spawn in valid positions
- keep the non-overlap logic or improve it with the new physics system

This should feel intuitive and playful.

---

## 8. New Rotation Interaction While Dragging

Add a new interaction:

When the user is dragging an object with the mouse, the mouse wheel should rotate that object.

### Required behavior:
- click and drag object = move object
- while dragging, scrolling the mouse wheel = rotate object
- rotation should feel smooth and controllable
- rotation should happen around the vertical axis
- the object should remain upright on the floor
- the interaction should feel natural and responsive

This should work as part of the normal drag interaction.

---

## 9. Improve the Physics Logic

The physical interaction between objects should feel more like real-world behavior.

Right now, simple collision / non-overlap is not enough.

I want a more physical relationship between objects.

### Desired behavior:
If I drag one object into another object:
- the other object should get pushed
- it should slide or be displaced
- it should not just act like a rigid immovable blocker
- objects should influence each other physically

In other words:
- dragged objects can push other objects
- chains of objects can move together
- the relationship should feel closer to real physical contact

It does not need to become a chaotic physics simulation, but it should feel much more like real objects on a floor.

### Important:
When one object pushes another:
- preserve upright orientation
- keep objects grounded on the floor
- prevent obvious clipping
- avoid jitter if possible
- keep the simulation stable

The effect should feel like:
“I am dragging one sign/cone/barrier and it nudges or pushes the nearby props, and those props respond.”

That is much closer to what I want.

---

## 10. Collision / Volume Logic

Objects should still have physical volume.

Requirements:
- no severe clipping through each other
- keep floor contact
- preserve object footprints
- allow pushing / displacement
- allow objects to settle into nearby positions
- do not make them completely static blockers

So compared to the previous logic:
- less strict “you cannot move through anything”
- more realistic “objects respond and get pushed”

This is a key behavior change.

---

## 11. Keep the Main Concept

The page is still an interactive 404 environment.

Keep the main central warning sign and the overall idea of:
- 404
- site under construction
- missing content
- maintenance
- warning objects as a visual language for page unavailability

Do not change the core concept.

This revision is about refining the interaction model and tightening the semantics, while preserving the visual assets.

---

## 12. What Not to Change

Do NOT:
- redesign the props
- remodel the 3D objects
- change the floor
- change the walls
- make the scene more Bauhaus
- create a new add-object scene object
- overcomplicate the environment
- replace the existing object family with a new one

The only visual/environment change should be:
- remove the sink
- update object text
- refine UI styling

Everything else should stay close to the current working version.

---

## 13. Implementation Priorities

Please implement in this order:

1. Preserve the current object models and scene
2. Remove the sink
3. Replace all inappropriate object text with the 404 / no-content / maintenance language system
4. Keep the current scene otherwise unchanged
5. Refine the UI using a Bauhaus / Swiss / modernist direction
6. Remove the standalone “Add Objects” control and replace it with “click existing object to spawn new object”
7. Add mouse-wheel rotation while dragging objects
8. Improve object-to-object physical interaction so dragged objects can push other objects
9. Keep buttons like Back to Home, Shuffle, and Clear, but style them consistently
10. Polish stability and interaction feel

---

## 14. Final Goal

The final version should feel like the existing project, but improved in a very controlled way.

It should:
- keep the current scene
- keep the current object models
- remove only the sink
- update all object text to fit the 404 / construction / no-content concept
- use a better UI style influenced by Bauhaus only at the interface level
- allow clicking existing objects to add new ones
- allow mouse-wheel rotation while dragging
- make object interactions feel more physically real, with pushing and displacement between props

Most importantly, this revision should feel like a careful refinement of the current build, not a new reinterpretation.