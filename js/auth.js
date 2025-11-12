document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const profileInfo = document.getElementById('profile-info');
  const msgEl = document.getElementById('msg');

  if (loginForm) {
    loginForm.addEventListener('submit', async e => {
      e.preventDefault();
      const fd = new FormData(loginForm);
      const username = fd.get('username');
      const password = fd.get('password');
      const res = await apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });
      if (res.status === 200 && res.body.token) {
        setToken(res.body.token);
        window.location = 'profile.html';
      } else {
        showMsg(msgEl, res.body && res.body.message ? res.body.message : 'Login failed');
      }
    });
  }

  if (registerForm) {
    registerForm.addEventListener('submit', async e => {
      e.preventDefault();
      const fd = new FormData(registerForm);
      const username = fd.get('username');
      const email = fd.get('email');
      const password = fd.get('password');
      const res = await apiFetch('/auth/register', { method: 'POST', body: JSON.stringify({ username, email, password }) });
      if (res.status === 201) {
        window.location = 'login.html';
      } else {
        showMsg(msgEl, res.body && res.body.message ? res.body.message : 'Registration failed');
      }
    });
  }

  if (profileInfo) {
    apiFetch('/auth/me', { method: 'GET' }).then(res => {
      if (res.status === 200) {
        const u = res.body;
        const profilePhoto = document.getElementById('profile-photo');
        const profilePhotoPlaceholder = document.getElementById('profile-photo-placeholder');
        if (u.photo) {
          profilePhoto.src = 'http://localhost:3000' + u.photo;
          profilePhoto.style.display = 'block';
          profilePhotoPlaceholder.style.display = 'none';
        } else {
          profilePhoto.style.display = 'none';
          profilePhotoPlaceholder.style.display = 'flex';
        }
        document.getElementById('profile-username').textContent = escapeHtml(u.username);
        document.getElementById('profile-email').textContent = escapeHtml(u.email || '—');
        document.getElementById('profile-address').textContent = escapeHtml(u.address || '—');
        document.getElementById('profile-joined').textContent = escapeHtml(u.joined || '—');

        document.getElementById('edit-username').value = u.username || '';
        document.getElementById('edit-email').value = u.email || '';
        document.getElementById('edit-address').value = u.address || '';

        const editBtn = document.getElementById('edit-profile-btn');
        const uploadPhotoBtn = document.getElementById('upload-photo-btn');
        const editPanel = document.getElementById('profile-edit');
        const photoPanel = document.getElementById('photo-edit');
        const viewPanel = document.getElementById('profile-view');
        const cancelBtn = document.getElementById('cancel-edit-btn');
        const cancelPhotoBtn = document.getElementById('cancel-photo-btn');
        const editForm = document.getElementById('profile-edit-form');
        const photoForm = document.getElementById('photo-upload-form');
        const editMsg = document.getElementById('edit-msg');
        const photoMsg = document.getElementById('photo-msg');

        function showEdit(show) {
          editPanel.style.display = show ? 'block' : 'none';
          viewPanel.style.display = show ? 'none' : 'block';
          photoPanel.style.display = 'none';
          editMsg.textContent = '';
        }

        function showPhotoUpload(show) {
          photoPanel.style.display = show ? 'block' : 'none';
          viewPanel.style.display = show ? 'none' : 'block';
          editPanel.style.display = 'none';
          photoMsg.textContent = '';
        }

        editBtn.addEventListener('click', () => showEdit(true));
        uploadPhotoBtn.addEventListener('click', () => showPhotoUpload(true));
        cancelBtn.addEventListener('click', () => showEdit(false));
        cancelPhotoBtn.addEventListener('click', () => showPhotoUpload(false));

        editForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          const fd = new FormData(editForm);
          const newUsername = (fd.get('username') || '').trim();
          const newEmail = (fd.get('email') || '').trim();
          const newAddress = (fd.get('address') || '').trim();
          const newPassword = (fd.get('password') || '').trim();

          if (!newUsername || !newEmail || !newAddress) {
            showMsg(editMsg, 'Username, email, and address are required');
            return;
          }

          const res = await apiFetch('/auth/me', { method: 'PUT', body: JSON.stringify({ username: newUsername, email: newEmail, address: newAddress, password: newPassword }) });

          if (res.status === 200) {
            showMsg(editMsg, 'Profile updated');
            document.getElementById('profile-username').textContent = escapeHtml(newUsername);
            document.getElementById('profile-email').textContent = escapeHtml(newEmail);
            document.getElementById('profile-address').textContent = escapeHtml(newAddress);
            setTimeout(() => { showEdit(false); }, 750);
          } else {
            const message = res.body && res.body.message ? res.body.message : 'Update failed';
            showMsg(editMsg, message);
          }
        });

        photoForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          const fd = new FormData(photoForm);

          const res = await apiFetch('/auth/me/photo', { method: 'POST', body: fd });

          if (res.status === 200) {
            showMsg(photoMsg, 'Photo uploaded');
            if (res.body.photo) {
              profilePhoto.src = 'http://localhost:3000' + res.body.photo;
              profilePhoto.style.display = 'block';
              profilePhotoPlaceholder.style.display = 'none';
            }
            setTimeout(() => { showPhotoUpload(false); }, 750);
          } else {
            const message = res.body && res.body.message ? res.body.message : 'Upload failed';
            showMsg(photoMsg, message);
          }
        });

      } else {
        window.location = 'login.html';
      }
    });
  }

});

function escapeHtml(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '<').replace(/>/g, '>'); }
