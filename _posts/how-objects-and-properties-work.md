---
title: How objects and properties work
slug: how-objects-and-properties-work
---

I wrote about prototypal inheritance before and I didn't like the way I went about it. I think it's best to just show a live example of the most basic and simplistic version of how properties are retrieved and go from there.


### What is an object?

Let's just take a quick moment to understand what an object is. An object is a way to store data by name. We often use them to represent different things. For example, we might want an object to represent a user that contains data to be saved to a database. It could have an age, username, or favorite food.

```__CODESECTION__
var age = 123;
var user = {
  username: 'musefan42',
  age: 42,
  favoriteFood: 'blueberry pancakes!!!',
};

user;
```




# *Part*

We get properties of an object with a dot. The dot is an operator (like the addition operator) that tells JavaScript, "Pretty please, get me the value of the property for this object.".

```__CODESECTION__
var user = {
  username: 'musefan42',
  age: 42,
  favoriteFood: 'blueberry pancakes!!!',
};

user.favoriteFood;
```




# *Part*

#### Non-existant properties

Objects that don't have the property you're looking for will return undefined. Pretty simple so far.

```__CODESECTION__
var user = {
  username: 'musefan42',
  age: 42,
  favoriteFood: 'blueberry pancakes!!!',
};

// user object doesn't have a firstName property.
user.firstName;
```




# *Part*

### Basic property gettin'

Let's say we want

 are retrieved from an object when they are non-existant, which is also named "Prototypal Inheritance".

```__CODESECTION__
var user = {};

user.pancakes;

user.__proto__ = {
  pancakes: 'yummmmmm!',
};

user.pancakes;
```

