# Bento

Bento is a NodeJS framework designed to make creating and maintaing complex projects a simple and fast process.

### What does Bento do:
* Component lifecycle state and management
* Provides consistent API for all components
* Config Loading API
* Event API
* Defines strict, opinionated, rules

### What is a Bento Component?
Bento indroduces a concept of components. Components are logical chunks of code that all work together to provide your application to the world.

Components should not take on more then required. (IE: instead of having one component for connecting to Discord and processing messages. Have two, one for the connection and one that handles messages)