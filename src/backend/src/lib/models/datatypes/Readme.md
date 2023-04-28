# Datatypes

This folder contains the valid data types used for e.g. data generation. 
The general idea is a follows: 

A few primitive data types exist (e.g. string, int, etc.). These will be used by the source provisioner to create schemas.
E.g. create a new database table that has certain columns. 

Besides the primitive types, a variety of complex Types exist. These complex types are instances of a certain primitive type but define a specific semantic. 
E.g. Firstname is a String with certain properties (has no spaces, the value is generally considered to be a name, etc.). 
These complex Types are used by the data generator plugins to create data instances. 

Also a generator plugin exists that creates instances of the primitive types but this is a fallback to ensure data can be generated every time. 

When in need of a new defined semantic, please add a complex type, implement a corresponding plugin and add the semantic of the atomic type to the docs: 
https://docs.padme-analytics.de/en/how-to/playground

Happy coding :)