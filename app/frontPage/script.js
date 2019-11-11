let homeDirectories = [];
window.onload = function() {
  getHomeDirectory();
  path.addEventListener("input", function(e) {
    createDirectoriesList(e);
  });
  homeDirectoriesList.addEventListener("click", function(e) {
    path.value = e.target.innerHTML;
  });
  deleteAll.addEventListener("click", function() {
    $("#list").hide(1000, function() {
      list.innerHTML = "";
      list.style.display = "block";
    });
  });
  sendFiles.addEventListener("click", sendFilesList);
  sendPath.addEventListener("click", sendPathToProject);
  selectByExtention.addEventListener("click", addSelectedFiles);
  edit.addEventListener("click", editDiagram);
};

/**
 *  create list of directroies in homeDirectry
 *  @param {object} event
 */
function createDirectoriesList(event) {
  homeDirectoriesList.innerHTML = "";
  let similars = homeDirectories.filter(elem => elem.startsWith(path.value));
  if (similars.length === 1 && R.path(["data"], event) != null) {
    path.value = similars[0];
    similars = [];
  }
  similars.forEach(elem => {
    let a = document.createElement("a");
    a.setAttribute("class", "list-group-item list-group-item-action");
    a.innerHTML = elem;
    homeDirectoriesList.append(a);
  });
}
/**
 *  get path to file from input and send it to server
 */
function sendPathToProject() {
  homeDirectoriesList.innerHTML = "";
  root.innerHTML = "";
  if (path.value) {
    $.ajax({
      type: "POST",
      url: "http://localhost:8081/create/fileSystem/",
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      data: JSON.stringify({ path: path.value }),
      success: function(data) {
        if (data.code === "ENOENT") {
          alert("No such file or directory");
        } else {
          createSystem(data);
        }
      }
    });
  } else {
    path.focus();
    alert("Enter path correctly");
  }
}
/**
 *  clean list and make fileSystem visible
 *  @param {object} structure - object with files and directories
 */
function createSystem(structure) {
  structureObject = structure;
  list.innerHTML = "";
  fileSystem.style.display = "block";
  const rootNode = document.getElementById("root");
  rootNode.appendChild(createFolderTree(structure));
  rootNode.ondblclick = appendFileToList;
}
/**
 *  draw file system in browser
 *  @param {array} arr - array with files and directories
 *  @returns {object} - document object
 */
function createFolderTree(arr, depth) {
  if (typeof depth === "number") depth++;
  else depth = 1;
  let structure = document.createDocumentFragment();
  for (let i = 0; i < arr.length; i++) {
    let div = document.createElement("div");
    div.innerHTML = arr[i].title;
    div.setAttribute("id", arr[i].path);
    div.prepend(createIcon(arr[i]));
    div.style.paddingLeft = "15px";
    div.addEventListener("click", function() {
      if (
        !(event.target.id.endsWith(".js") || event.target.id.endsWith(".json"))
      ) {
        project.value = event.target.id;
        project.focus();
      }
      if (arr[i].folder && div.children.length === 1) {
        let p = document.createElement("p");
        p.innerHTML = "Empty folder";
        div.appendChild(p);
      }
      if (div.children[1] != undefined) {
        if (div.children[1].style.display === "block") {
          closedFolderIcon(div);
          none(div.children);
        } else {
          openedFolderIcon(div);
          block(div.children);
        }
      }
      event.stopImmediatePropagation();
    });
    if (depth != 1) {
      div.style.display = "none";
    }
    if (arr[i].children) {
      div.appendChild(createFolderTree(arr[i].children, depth));
    }
    structure.appendChild(div);
  }
  return structure;
}
/**
 *  if parent folder is closed, all descendant should also be closed
 *  @param {array} arr - array with files and directories
 */
function none(arr) {
  for (let i = 1; i < arr.length; i++) {
    if (arr[i].children.length != 0) {
      none(arr[i].children);
    }
    arr[i].style.display = "none";
  }
}
/**
 *  if parent folder is opened, all descendant should also be visible
 *  @param {array} arr - array with files and directories
 */
function block(arr) {
  arr[0].style.display = "inline";
  for (let i = 1; i < arr.length; i++) {
    arr[i].style.display = "block";
  }
}

/**
 *  check object field folder
 *  @returns {boolean}
 */

function isFolder(folder) {
  if (folder.folder) return true;
}
/**
 *  append icons to files and folders
 *  @returns {object} image
 */
function createIcon(elem) {
  let img = document.createElement("img");

  if (elem.folder)
    img.setAttribute(
      "src",
      "https://img.icons8.com/cute-clipart/64/000000/folder-invoices.png"
    );
  else
    img.setAttribute(
      "src",
      "https://cdn2.iconfinder.com/data/icons/strongicon-vol-24-free/24/filetype-11-512.png"
    );

  return img;
}
/**
 * append icons to files and folders
 * @param {object} elem - elem i have been recently clicking
 * @returns {str} changed image (opened folder)
 */

function openedFolderIcon(elem) {
  let img = elem.firstChild;
  img.src = "https://img.icons8.com/cute-clipart/64/000000/opened-folder.png";
}
/**
 * append icons to files and folders
 * @param {object} elem - elem i have been recently clicking
 * @returns {str} changed image (closed folder)
 */
function closedFolderIcon(elem) {
  for (let i = 0; i < elem.children.length; i++) {
    if (elem.children[i].children.length > 1) {
      closedFolderIcon(elem.children[i]);
    } else {
      elem.children[0].src =
        "https://img.icons8.com/cute-clipart/64/000000/folder-invoices.png";
    }
  }
}
/**
 *  send request to server. Receive home directory name and directories in this directory
 */
function getHomeDirectory() {
  $.ajax({
    type: "GET",
    url: "http://localhost:8081/homedir/",
    contentType: "application/json; charset=utf-8",
    success: function(data, err) {
      homeDirectories = data.directories;
      path.value = `${data.homedir}/`;
      createDirectoriesList();
    }
  });
}
/**
 * get data from list and send it to server
 */
function sendFilesList() {
  let list = document.getElementsByClassName("list-group-item");
  let paths = [];
  if (!list.length) {
    alert("No files");
  } else {
    for (let i = 0; i < list.length; i++) {
      paths.push(list[i].id);
    }
    $.ajax({
      type: "POST",
      url: "http://localhost:8081/create/diagram/",
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      data: JSON.stringify({ paths: paths }),
      success: function(data, err) {
        if (data.code === 500) {
          alert(data.message);
        } else {
          alert(data.message);
          window.open("http://localhost:8081/diagram/", "_blank", "");
        }
      }
    });
  }
}
/**
 * make request for edit savedDiagram
 */
function editDiagram() {
  $.ajax({
    type: "PUT",
    url: "http://localhost:8081/edit/diagram/",
    contentType: "application/json; charset=utf-8",
    success: function(data, err) {
      window.open("http://localhost:8081/diagram/", "_blank", "");
    }
  });
}
/**
 * append item to filesList
 * @param {string} listItem
 */
function appendFileToList(listItem) {
  if (listItem.target) listItem = listItem.target.id;
  if ([...list.children].some(child => child.id === listItem)) return; //list shouldn't has similar files
  if (listItem.endsWith(".js") || listItem.endsWith(".json")) {
    let a = document.createElement("a");
    a.setAttribute("class", "list-group-item list-group-item-action");
    a.id = listItem;
    let button = document.createElement("button");
    button.setAttribute("class", "btn btn-outline-secondary btn-sm ml-1 mr-1");
    button.innerHTML = "Del";
    let idForDelete = listItem;
    button.addEventListener("click", function() {
      let elemforRemove = document.getElementById(idForDelete);
      event.target.parentElement.remove();
    });
    a.appendChild(button);
    a.appendChild(document.createTextNode(`  ${listItem}`));
    list.appendChild(a);
  }
}
/**
 * get all paths from project by extention
 * @param {string} extention
 * @param {object} structureObject - object with files and directories
 * @returns {array} all links from project with passed extantion
 */
function getPathsbyExtention(extention, structureObject) {
  let links = [];
  for (let i = 0; i < structureObject.length; i++) {
    if (structureObject[i].folder) {
      links.push(
        ...R.flatten(
          getPathsbyExtention(extention, structureObject[i].children)
        )
      );
    } else if (structureObject[i].title.endsWith(extention)) {
      links.push(structureObject[i].path);
    }
  }
  return links;
}
/**
 * find selected structure by path from structureObject
 * @param {string} path - path to selected Project
 * @param {object} structureObject - object with files and directories
 * @returns {object} - selected part from structureObject
 */

function findStructure(path, structureObject) {
  if (!path) return;
  let result;
  let search = (path, structureObject) => {
    for (let i = 0; i < structureObject.length; i++) {
      if (path === structureObject[i].path) {
        result = structureObject[i];
        return;
      }
      if (
        structureObject[i].folder &&
        structureObject[i].path.length < path.length
      )
        search(path, structureObject[i].children);
    }
  };
  search(path, structureObject);
  return result;
}
/**
 * append all files with equal extention to specified in selected input
 */
function addSelectedFiles() {
  let selectedStructure = [findStructure(project.value, structureObject)];
  if (!project.value) {
    alert("Enter path to project");
    project.focus();
    return;
  }
  if (!extention.value) {
    alert("Enter extention");
    extention.focus();
    return;
  }
  let links = getPathsbyExtention(extention.value, selectedStructure);
  links.forEach(appendFileToList);
}
