window.onload = async function() {
  axios.defaults.withCredentials = true;

  const formData = document.getElementById("form");
  formData.addEventListener("submit", sendData);

  function sendData(event) {
    event.preventDefault();
    if (checkInputs(event)) {
      let extractedFormData = new FormData(formData);
      axios({
        method: "post",
        url: "/diagram/create/remoteDb",
        data: extractedFormData,
        headers: { "Content-Type": "multipart/form-data" }
      })
        .then(function(response) {
          if (response.data.code === 200) {
            alert("Diagram created");
            window.location.href = "../user/profile/";
          } else {
            alert(response.data.message);
          }
        })
        .catch(function(response) {
          //handle error
          console.log(response);
        });
    } else {
      alert("Incorrect data");
    }
  }
  function checkInputs(event) {
    let ip = ValidateIPaddress(document.getElementById("remoteServer"));
    if (!ip) return false;
    let port = document.getElementById("remotePort").value;
    if (!port) return false;
    let sshKey = document.getElementById("sshKey").files;
    let sshUser = document.getElementById("sshUser").value;
    let dbName = document.getElementById("dbName").value;
    if (!dbName) return false;
    let dbUserName = document.getElementById("dbUserName").value;
    let dbUserPass = document.getElementById("dbUserPass").value;
    return true;
  }

  function ValidateIPaddress(ipAddressInput) {
    if (
      /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(
        ipAddressInput.value
      )
    ) {
      return ipAddressInput.value;
    }
    ipAddressInput.value = "";
    ipAddressInput.focus();
    throw { message: "Incorrect Ip address" };
  }
};
