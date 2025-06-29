const uploadForm = document.getElementById('uploadForm');
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const submitButton = document.getElementById('submitButton');
const buttonText = submitButton.querySelector('.button-text');
const buttonLoader = submitButton.querySelector('.button-loader');
const uploadResults = document.getElementById('uploadResults');
const resultsList = document.getElementById('resultsList');
const emailGroup = document.getElementById('emailGroup');
const emailInput = document.getElementById('emailInput');

var selectedFiles = [];
var isUploading = false;

document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    initializeAnimations();
    initializeNavigation();
});

function initializeEventListeners() {
    fileInput.addEventListener('change', handleFileSelect);
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    uploadForm.addEventListener('submit', handleFormSubmit);

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        document.addEventListener(eventName, preventDefaults, false);
    });
}

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    updateSelectedFiles(files);
}

function handleDragOver(e) {
    uploadArea.classList.add('drag-over');
}

function handleDragLeave(e) {
    uploadArea.classList.remove('drag-over');
}

function handleDrop(e) {
    uploadArea.classList.remove('drag-over');
    const files = Array.from(e.dataTransfer.files);
    updateSelectedFiles(files);
}

function updateSelectedFiles(files) {
    selectedFiles = files;
    updateUploadAreaText();

    uploadArea.style.transform = 'scale(0.98)';
    uploadArea.style.filter = 'brightness(1.1)';
    
    if (files.length > 0) {
        uploadArea.style.boxShadow = '0 0 20px rgba(0, 112, 243, 0.3)';
    }
    
    setTimeout(() => {
        uploadArea.style.transform = 'scale(1)';
        uploadArea.style.filter = 'brightness(1)';
        uploadArea.style.boxShadow = '';
    }, 300);
    

    const uploadPrimary = uploadArea.querySelector('.upload-primary');
    if (files.length > 0) {
        uploadPrimary.style.transform = 'scale(1.05)';
        setTimeout(() => {
            uploadPrimary.style.transform = 'scale(1)';
        }, 200);
    }
}

function updateUploadAreaText() {
    const uploadPrimary = uploadArea.querySelector('.upload-primary');

    if (selectedFiles.length > 0) {
        uploadPrimary.textContent = `${selectedFiles.length} file(s) selected - Total size: ${formatFileSize(getTotalSize())}`;
        uploadArea.style.borderColor = 'var(--accent-primary)';
        uploadArea.style.background = 'rgba(0, 112, 243, 0.05)';
    } else {
        uploadPrimary.textContent = 'Choose files or drag them here';
        uploadArea.style.borderColor = 'var(--border-primary)';
        uploadArea.style.background = 'var(--bg-tertiary)';
    }
}

function getTotalSize() {
    return selectedFiles.reduce((total, file) => total + file.size, 0);
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}



async function handleFormSubmit(e) {
    e.preventDefault();

    if (selectedFiles.length === 0) {
        showNotification('Please select files to upload', 'error');
        return;
    }

    if (isUploading) return;

    await uploadFiles(selectedFiles, 'single', null);
}

async function uploadFiles(files, mode, email) {
    isUploading = true;
    setLoadingState(true);
    setUploadGlow('uploading');

    try {
        const formData = new FormData();

        files.forEach(file => {
            formData.append('file', file);
        });

        formData.append('mode', 'single');

        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (response.ok && result.success) {
            setUploadGlow('success');
            showUploadResults(result.files);
            resetForm();
            showNotification('Files uploaded successfully!', 'success');
            
            setTimeout(() => {
                setUploadGlow('normal');
            }, 1000);
        } else {
            throw new Error(result.error || 'Upload failed');
        }
    } catch (error) {
        console.error('Upload error:', error);
        setUploadGlow('error');
        showNotification(error.message || 'Upload failed. Please try again.', 'error');
        
        setTimeout(() => {
            setUploadGlow('normal');
        }, 4500);
    } finally {
        isUploading = false;
        setLoadingState(false);
    }
}

function setLoadingState(loading) {
    submitButton.disabled = loading;

    if (loading) {
        buttonText.style.opacity = '0';
        buttonLoader.style.display = 'block';
        submitButton.style.background = 'var(--text-muted)';
    } else {
        buttonText.style.opacity = '1';
        buttonLoader.style.display = 'none';
        submitButton.style.background = 'var(--gradient-primary)';
    }
}

function setUploadGlow(state) {
    const body = document.body;
    const uploadContainer = document.querySelector('.upload-container');
    body.classList.remove('uploading', 'upload-error');
    uploadContainer.classList.remove('uploading', 'upload-error');
    switch(state) {
        case 'uploading':
            body.classList.add('uploading');
            uploadContainer.classList.add('uploading');
            break;
        case 'error':
            body.classList.add('upload-error');
            uploadContainer.classList.add('upload-error');
            break;
        case 'success':
            body.classList.add('uploading');
            uploadContainer.classList.add('uploading');
            break;
        case 'normal':
        default:
            break;
    }
}

function showUploadResults(files) {
    resultsList.innerHTML = '';

    files.forEach((file, index) => {
        const resultItem = createResultItem(file, index);
        resultItem.style.animationDelay = `${index * 0.1}s`;
        resultsList.appendChild(resultItem);
    });

    uploadResults.style.display = 'block';
    animateElementIn(uploadResults);

    setTimeout(() => {
        const items = resultsList.querySelectorAll('.result-item');
        items.forEach((item, index) => {
            setTimeout(() => {
                item.style.opacity = '1';
                item.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }, 200);

    setTimeout(() => {
        uploadResults.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 300);
}

function createResultItem(file, index) {
    const item = document.createElement('div');
    item.className = 'result-item';
    item.style.animationDelay = `${index * 0.1}s`;

    item.innerHTML = `
        <div class="result-header">
            <span class="result-name">${file.name}</span>
            <span class="result-size">${file.formattedSize}</span>
        </div>
        <div class="result-url" onclick="copyToClipboard('${file.url}', this)" style="cursor: pointer;">
            <span class="url-text">${file.url}</span>
        </div>
        ${file.expires ? `<div class="result-expires">Expires in: ${file.formattedExpires}</div>` : ''}
    `;

    return item;
}

function resetForm() {
    selectedFiles = [];
    fileInput.value = '';
    updateUploadAreaText();
}

async function copyToClipboard(text, element) {
    try {
        await navigator.clipboard.writeText(text);
        
        const ripple = document.createElement('div');
        ripple.style.cssText = `
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.3);
            transform: scale(0);
            animation: ripple 0.6s linear;
            pointer-events: none;
        `;
        
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = '50%';
        ripple.style.top = '50%';
        ripple.style.marginLeft = -size/2 + 'px';
        ripple.style.marginTop = -size/2 + 'px';
        
        element.style.position = 'relative';
        element.appendChild(ripple);
        
        if (!document.querySelector('#ripple-keyframes')) {
            const style = document.createElement('style');
            style.id = 'ripple-keyframes';
            style.textContent = `
                @keyframes ripple {
                    to {
                        transform: scale(2);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        const originalBg = element.style.background;
        element.style.background = 'rgba(255, 255, 255, 0.2)';
        element.style.transition = 'all 0.3s ease';
        element.style.transform = 'scale(1.02)';

        setTimeout(() => {
            element.style.background = originalBg;
            element.style.transform = 'scale(1)';
            if (ripple.parentNode) {
                ripple.parentNode.removeChild(ripple);
            }
        }, 1000);

        showNotification('URL copied to clipboard!', 'success');
    } catch (error) {
        console.error('Copy failed:', error);
        showNotification('Failed to copy URL', 'error');
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    Object.assign(notification.style, {
        position: 'fixed',
        top: '2rem',
        right: '2rem',
        padding: '1rem 1.5rem',
        borderRadius: '0.5rem',
        color: 'white',
        fontWeight: '600',
        zIndex: '10000',
        transform: 'translateX(100%)',
        transition: 'transform 0.3s ease',
        boxShadow: 'var(--shadow-lg)'
    });

    const colors = {
        success: 'var(--success)',
        error: 'var(--error)',
        warning: 'var(--warning)',
        info: 'var(--accent-primary)'
    };
    notification.style.background = colors[type] || colors.info;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);

    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 4000);
}

function animateElementIn(element) {
    element.style.opacity = '0';
    element.style.transform = 'translateY(20px)';

    setTimeout(() => {
        element.style.transition = 'all 0.5s ease';
        element.style.opacity = '1';
        element.style.transform = 'translateY(0)';
    }, 50);
}

function toggleFaq(button) {
    const faqItem = button.closest('.faq-item');
    const isActive = faqItem.classList.contains('active');

    document.querySelectorAll('.faq-item').forEach(item => {
        item.classList.remove('active');
    });

    if (!isActive) {
        faqItem.classList.add('active');
    }

    const icon = button.querySelector('.faq-icon');
    icon.style.transform = isActive ? 'rotate(0deg)' : 'rotate(180deg)';
}

function initializeNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');

            if (href.startsWith('#')) {
                e.preventDefault();
                const targetId = href.substring(1);
                const targetElement = document.getElementById(targetId);

                if (targetElement) {
                    navLinks.forEach(l => l.classList.remove('active'));
                    this.classList.add('active');
                      targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });

    window.addEventListener('scroll', updateActiveNavLink);
}

function updateActiveNavLink() {
    const sections = ['home', 'faq'];
    const navLinks = document.querySelectorAll('.nav-link');

    var currentSection = 'home';

    sections.forEach(sectionId => {
        const section = document.getElementById(sectionId);
        if (section) {
            const rect = section.getBoundingClientRect();
            if (rect.top <= 100 && rect.bottom >= 100) {
                currentSection = sectionId;
            }
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${currentSection}`) {
            link.classList.add('active');
        }
    });
}

function initializeAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    const animatedElements = document.querySelectorAll('.faq-item, .upload-container');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.6s ease';
        observer.observe(el);
    });

    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const parallax = document.querySelector('.bg-grid');
        if (parallax) {
            parallax.style.transform = `translate(${scrolled * 0.1}px, ${scrolled * 0.1}px)`;
        }
    });

    animateTyping();
}

function animateTyping() {
    const titleLines = document.querySelectorAll('.title-line');

    titleLines.forEach((line, index) => {
        const text = line.textContent;
        line.textContent = '';
        line.style.opacity = '1';

        setTimeout(() => {
            var charIndex = 0;
            const typeInterval = setInterval(() => {
                line.textContent += text[charIndex];
                charIndex++;

                if (charIndex >= text.length) {
                    clearInterval(typeInterval);
                }
            }, 50);
        }, index * 1000);
    });
}

function debounce(func, wait) {
    var timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

const debouncedScrollHandler = debounce(updateActiveNavLink, 100);
window.addEventListener('scroll', debouncedScrollHandler);

function preloadResources() {
    const criticalImages = [
    ];

    criticalImages.forEach(src => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = src;
        document.head.appendChild(link);
    });
}

preloadResources();

