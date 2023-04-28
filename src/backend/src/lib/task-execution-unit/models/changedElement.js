//A file that has been changed
class ChangedElement
{
  constructor(name, path, changeType, children)
  {
    this.name = name;
    this.path = path;
    this.changeType = changeType;
    this.children = children;
  }

  /**
   * Adds a child to the given
   * @param {*} changeFile 
   */
  addChild(changeFile)
  {
    this.children.push(changeFile);
  }
}

module.exports = ChangedElement