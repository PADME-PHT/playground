## Plugin Manager

the PluginManager manages plugins in the form of node modules. 
Each module should be contained in a own folder in the provided directory. 

Also each module should export the following: 

- enabled -> Whether the plugin should be loaded
- class -> A Reference to a node class that represents the plugin logic. Each usage of the manager can define different required properties/functions of this class
- info -> An array with info objects describing the plugin. Each usage of the manager can define different properties of these info objects