const UTILS = {};

UTILS.sleep = function(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

UTILS.errorModal = function(errorMsg){
    let mymodal;
    document.getElementById("err-modal-body").innerHTML = errorMsg;
    myModal = new bootstrap.Modal(document.getElementById('errorModal'), {})
    myModal.show();
}

