document.addEventListener("DOMContentLoaded", function () {
  particlesJS("particles-js", {
    particles: {
      number: { value: 80, density: { enable: true, value_area: 800 } },
      color: { value: "#ff00ff" },
      shape: { type: "circle" },
      opacity: { value: 0.5 },
      size: { value: 3, random: true },
      line_linked: { enable: true, distance: 150, color: "#ff00ff", opacity: 0.4, width: 1 },
      move: { enable: true, speed: 2 },
    },
    interactivity: {
      events: {
        onhover: { enable: true, mode: "repulse" },
        onclick: { enable: true, mode: "push" },
      },
    },
    retina_detect: true,
  });

  const fileInput = document.getElementById("fileInput");
  const fileList = document.getElementById("fileList");
  const dragZone = document.getElementById("dragZone");
  const folderUploadBtn = document.getElementById("folderUpload");
  const infoIcon = document.getElementById("uploadInfoIcon");
  const infoTooltip = document.getElementById("infoTooltip");
  const tooltipContent = infoTooltip.querySelector(".tooltip-content");

  infoIcon.addEventListener("click", () => {
    infoTooltip.classList.toggle("active");
  });

  document.addEventListener("click", (e) => {
    if (!infoIcon.contains(e.target)) {
      infoTooltip.classList.remove("active");
    }
  });

  fetch("/info")
    .then((response) => response.json())
    .then((data) => {
      tooltipContent.innerHTML = `
        <p><i class="fas fa-tachometer-alt"></i>${data.request_limit} requests in ${data.rate_limit}</p>
        <p><i class="fas fa-file-alt"></i>${data.file_size}MB max file size</p>
        <p><i class="fas fa-copy"></i>Max ${data.max_files} files can be uploaded</p>
        ${data.auto_delete_time ? `<p><i class="fas fa-clock"></i>Auto deletes after ${formatMinutes(data.auto_delete_time)}</p>` : ""}
      `;
    })
    .catch((error) => {
      tooltipContent.innerHTML = `<p>Error loading config info</p>`;
      console.error("Error fetching config info:", error);
    });

  folderUploadBtn.addEventListener("click", function () {
    const input = document.createElement("input");
    input.type = "file";
    input.webkitdirectory = true;
    input.directory = true;
    input.multiple = true;

    input.addEventListener("change", function (e) {
      handleFiles(e.target.files);
    });

    input.click();
  });

  ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
    dragZone.addEventListener(eventName, preventDefaults, false);
    document.body.addEventListener(eventName, preventDefaults, false);
  });

  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  ["dragenter", "dragover"].forEach((eventName) => {
    dragZone.addEventListener(eventName, highlight, false);
  });

  ["dragleave", "drop"].forEach((eventName) => {
    dragZone.addEventListener(eventName, unhighlight, false);
  });

  function highlight() {
    dragZone.classList.add("active");
  }

  function unhighlight() {
    dragZone.classList.remove("active");
  }

  dragZone.addEventListener("drop", function (e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
  });

  fileInput.addEventListener("change", function (event) {
    handleFiles(event.target.files);
  });

  function handleFiles(files) {
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      uploadFile(files[i]);
    }

    fileInput.value = "";

    if (files.length === 1) {
      showNotification("File added to upload queue", "success");
    } else {
      showNotification(`${files.length} files added to upload queue`, "success");
    }
  }

  function uploadFile(file) {
    const fileItem = document.createElement("div");
    fileItem.className = "file-item";

    const fileExtension = file.name.split(".").pop().toLowerCase();
    let fileTypeClass = "unknown";
    let fileTypeIcon = "fa-file";

    if (["jpg", "jpeg", "png", "gif", "webp", "svg", "ico", "heic", "heif", "avif"].includes(fileExtension)) {
      fileTypeClass = "image";
      fileTypeIcon = "fa-file-image";
    } else if (["mp4", "webm", "avi", "mov", "wmv", "flv", "mkv", "m4v", "3gp", "mpeg", "mpg", "ogv"].includes(fileExtension)) {
      fileTypeClass = "video";
      fileTypeIcon = "fa-file-video";
    } else if (["doc", "docx", "pdf", "txt", "rtf", "odt", "xls", "xlsx", "ppt", "pptx", "csv", "md"].includes(fileExtension)) {
      fileTypeClass = "document";
      fileTypeIcon = "fa-file-alt";
    } else if (["zip", "rar", "7z", "tar", "gz", "bz2", "xz", "iso"].includes(fileExtension)) {
      fileTypeClass = "archive";
      fileTypeIcon = "fa-file-archive";
    } else if (["mp3", "wav", "ogg", "flac", "aac", "m4a", "wma", "alac"].includes(fileExtension)) {
      fileTypeClass = "audio";
      fileTypeIcon = "fa-file-audio";
    } else if (["html", "css", "js", "ts", "php", "py", "java", "cpp", "c", "cs", "rb", "go", "rs", "swift", "kt", "json", "xml", "yml", "sh"].includes(fileExtension)) {
      fileTypeClass = "code";
      fileTypeIcon = "fa-file-code";
    }

    const { formatBytes } = utils;
    const formattedSize = formatBytes(file.size);

    fileItem.innerHTML = `
            <div class="file-header">
                <div class="file-info">
                    <div class="file-icon ${fileTypeClass}">
                        <i class="fas ${fileTypeIcon}"></i>
                    </div>
                    <div class="file-details">
                        <div class="file-name">${file.name}</div>
                        <div class="file-size">${formattedSize}</div>
                    </div>
                </div>
                <div class="file-actions" style="display: none;">
                    <button class="file-button view-btn" title="View file">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="file-button copy-btn" title="Copy link">
                        <i class="fas fa-link"></i>
                    </button>
                </div>
            </div>
            <div class="progress-container">
                <div class="progress-bar"></div>
            </div>
            <div class="progress-text">Waiting...</div>
        `;

    fileList.appendChild(fileItem);

    const progressBar = fileItem.querySelector(".progress-bar");
    const progressText = fileItem.querySelector(".progress-text");
    const fileActions = fileItem.querySelector(".file-actions");
    let formData = new FormData();

    formData.append("file", file);

    try {
      let xhr = new XMLHttpRequest();
      xhr.open("POST", "/upload", true);
      xhr.setRequestHeader("Authorization", "Bearer " + "YOUR_BEARER_TOKEN");

      xhr.upload.onprogress = function (event) {
        if (event.lengthComputable) {
          let percentComplete = (event.loaded / event.total) * 100;
          progressBar.style.width = percentComplete + "%";
          progressText.innerText = Math.round(percentComplete) + "%";
        }
      };

      xhr.onload = function () {
        if (xhr.status === 200) {
          try {
            let response = JSON.parse(xhr.responseText);
            if (response.success) {
              progressText.innerText = "Completed";
              progressBar.style.width = "100%";
              fileActions.style.display = "flex";

              const viewBtn = fileItem.querySelector(".view-btn");
              const copyBtn = fileItem.querySelector(".copy-btn");
              const fileUrl = response.files[0].url;

              viewBtn.addEventListener("click", function () {
                window.open(fileUrl, "_blank");
              });

              copyBtn.addEventListener("click", function () {
                navigator.clipboard
                  .writeText(fileUrl)
                  .then(function () {
                    showNotification("Link copied to clipboard!", "success");
                  })
                  .catch(function () {
                    showNotification("Failed to copy link", "error");
                  });
              });

              showNotification(`${file.name} uploaded successfully!`, "success");
            } else {
              progressText.innerText = "Failed";
              showNotification(`${response.error || "Unknown server error"}`, "error");
            }
          } catch (error) {
            progressText.innerText = "Error";
            showNotification("Failed to process server response", "error");
          }
        } else {
          progressText.innerText = "Error";
          try {
            const response = JSON.parse(xhr.responseText);
            showNotification(`${response.error || "Unknown server error"}`, "error");
          } catch (e) {
            showNotification(`Server error (${xhr.status})`, "error");
          }
        }
      };

      xhr.onerror = function () {
        progressText.innerText = "Error";
        showNotification("Network error occurred", "error");
      };

      xhr.send(formData);
    } catch (error) {
      progressText.innerText = "Error";
      showNotification(`Error: ${error.message}`, "error");
    }
  }

  function showNotification(message, type = "success") {
    const notificationContainer = document.getElementById("notificationContainer");

    const notification = document.createElement("div");
    notification.className = `notification ${type}`;

    const icon = type === "success" ? "fa-check-circle" : "fa-exclamation-circle";

    notification.innerHTML = `
            <div class="notification-icon">
                <i class="fas ${icon}"></i>
            </div>
            <div class="notification-text">${message}</div>
        `;

    notificationContainer.appendChild(notification);

    setTimeout(() => {
      notification.classList.add("fadeOut");
      setTimeout(() => {
        notificationContainer.removeChild(notification);
      }, 300);
    }, 3000);
  }

  function formatMinutes(minutes) {
    minutes = Number.parseInt(minutes, 10);

    if (isNaN(minutes)) return "unknown time";

    if (minutes < 60) {
      return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
    } else if (minutes < 24 * 60) {
      const hours = Math.floor(minutes / 60);
      return `${hours} hour${hours !== 1 ? "s" : ""}`;
    } else if (minutes < 7 * 24 * 60) {
      const days = Math.floor(minutes / (24 * 60));
      return `${days} day${days !== 1 ? "s" : ""}`;
    } else if (minutes < 30 * 24 * 60) {
      const weeks = Math.floor(minutes / (7 * 24 * 60));
      return `${weeks} week${weeks !== 1 ? "s" : ""}`;
    } else if (minutes < 365 * 24 * 60) {
      const months = Math.floor(minutes / (30 * 24 * 60));
      return `${months} month${months !== 1 ? "s" : ""}`;
    } else {
      const years = Math.floor(minutes / (365 * 24 * 60));
      return `${years} year${years !== 1 ? "s" : ""}`;
    }
  }
});
