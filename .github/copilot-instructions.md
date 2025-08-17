Keep summeraries consise. 
Never use emotionally charged language or grammar like exclamation points. 
totally flat tone please. no emotionality.
Never assume you've fixed a problem, never make statements, always communicate your intention but never imply there is certainty. 
Always support the modular structure of the project. 
Always save test files and documentation in a subfolder not the main directory. 
on every commit, increment the build number shown in the console so I know when builds are updated.
always build in a way that I can test locally. Always open a local instance where I can locally test before committing. 
Always read files completely before editing
Use more precise replacement targets
Validate HTML structure after edits
Be more conservative with file modifications

Module Factory Pattern: "Module factories must return objects with async init() methods that get called during registration. Never return pre-existing global objects as modules."

Integration Testing: "After making changes to module loading or initialization, always test that modules auto-initialize correctly without requiring manual intervention."

Lifecycle Validation: "When working with modular systems, verify that each module properly implements the expected lifecycle methods (init(), etc.) and integrates with the core system's registration process."

Wrapper Pattern: "If you need to integrate existing global objects (like window.TaskbarModule) into a modular system, create a proper wrapper module that delegates to the global object rather than returning the global object directly."