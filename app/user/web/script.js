window.onload = async function() {
  const firstNameHeader = document.getElementById("firstName");
  const lastNameHeader = document.getElementById("lastName");
  const projectsList = document.getElementById("projectsList");
  const countDiagrams = document.getElementById("countDiagrams");
  const diagramName = document.getElementById("diagramName");
  const downloadProject = document.getElementById("downloadProject");
  const deleteProject = document.getElementById("deleteProject");
  const editDiagramName = document.getElementById("editDiagramName");
  const newProjectName = document.getElementById("newProjectName");
  const diagramMenu = document.getElementById("diagramMenu");
  const closeDiagramMenu = document.getElementById("closeDiagramMenu");
  const userEmail = document.getElementById("userEmail");
  const sendProjectByEmail = document.getElementById("sendProjectByEmail");
  closeDiagramMenu.addEventListener("click", function() {
    location.reload();
  });
  deleteProject.addEventListener("click", deleteProjectFolder);
  downloadProject.addEventListener("click", downloadProjectZip);
  projectsList.addEventListener("click", redirectToDiagram);
  editDiagramName.addEventListener("click", editProjectName);
  sendProjectByEmail.addEventListener("click", sendProjectDataByEmail);
  await setUserData(await getUserData());

  /**
   * Function which set user data got from server
   * @param {Object}
   */
  function setUserData({ firstName, lastName, projects }) {
    firstNameHeader.innerHTML = firstName;
    lastNameHeader.innerHTML = lastName;
    if (projects.length) {
      projectsList.innerHTML = projects.map(({ name }) => {
        return `<a class="dropdown-item">${name}</a>`;
      });
      countDiagrams.innerHTML = projects.length;
    } else {
      projectsList.innerHTML = "empty";
    }
  }
  /**
   * function to get user data from server
   * @returns {Object} - user data (email, projects, first and second name)
   */
  async function getUserData() {
    const response = getResponse(
      await axios({
        method: "get",
        url: "../data"
      })
    );
    const user = response.data;
    return user;
  }
  /**
   * Function which get chosen diagram data from server
   * @param {Object} event  - event object
   *
   */
  async function redirectToDiagram(event) {
    if (event.target.className === "dropdown-item") {
      const response = getResponse(
        await axios({
          method: "get",
          url: `../../diagram/project/${event.target.innerHTML}`
        })
      );
      if (response.code === 200) {
        diagramMenu.style.display = "block";
        diagramName.innerHTML = response.data.projectName;
        if (R.path(["data", "tables", "length"], response)) {
          createDiagam(response.data.tables);
        }
        if (R.path(["data", "coordinates", "length"], response)) {
          setTimeout(setLocation, 2500, response.data.coordinates);
        }
      }
    }
  }
  /**
   * Function which send request for download project as zip file
   */
  async function downloadProjectZip() {
    let response = await axios({
      method: "get",
      url: `../../diagram/download/${diagramName.innerHTML}`,
      responseType: "blob"
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `erd-${diagramName.innerHTML}.zip`); //or any other extension
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
  /**
   * Function which delete user project
   */
  async function deleteProjectFolder() {
    let response = getResponse(
      await axios({
        method: "delete",
        url: `../project/${diagramName.innerHTML}`
      })
    );
    if (response.code === 200) {
      alert(`${diagramName.innerHTML} succesfully deleted`);
      location.reload();
    } else {
      alert(response.message);
    }
  }
  /**
   * Function which edit project name
   */
  async function editProjectName() {
    if (!newProjectName.value) {
      alert("Enter project name");
      return;
    }
    if (
      [...projectsList.children].some(
        child => child.innerHTML === newProjectName.value
      )
    ) {
      alert("Project with this name already exists");
      return;
    }

    let dataForSending = { newName: newProjectName.value };
    let response = getResponse(
      await axios({
        method: "put",
        url: `../project/${diagramName.innerHTML}`,
        data: dataForSending,
        headers: { "Content-Type": "application/json" }
      })
    );
    if (response.code === 200) {
      location.reload();
    } else {
      alert(response.message);
    }
  }
  /**
   * Function which send email and project name to server
   */
  async function sendProjectDataByEmail() {
    const email = userEmail.value;
    if (!email) {
      alert("Enter email");
      return;
    }
    if (!validateEmail(email)) {
      alert("Incorrect email");
      return;
    }
    const response = getResponse(
      await axios({
        method: "post",
        url: `../../diagram/sendByEmail/${diagramName.innerHTML}`,
        data: {
          email
        }
      })
    );
    if (response.code === 200) {
      alert(`${diagramName.innerHTML} was sent to ${email}`);
      location.reload();
    } else {
      alert(response.message);
    }
  }
  /**
   * Function which get data from response
   * */
  function getResponse(response) {
    return response.data;
  }
  /**
   * FUnction which validate email
   * @param {String} email
   * @returns {Boolean} is email or not
   */
  function validateEmail(email) {
    const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
  }
};
