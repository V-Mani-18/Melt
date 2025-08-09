import React, { useState, useEffect } from 'react';
import axios from 'axios';

const EditProfile = () => {
  const [image, setImage] = useState(null);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [dob, setDob] = useState('');
  const [about, setAbout] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Assume you store the logged-in user ID in localStorage or context
  const userId = localStorage.getItem('userId'); // or get from context

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch user details on mount
  useEffect(() => {
    if (!userId) return;
    axios.get(`/api/user/${userId}`)
      .then(res => {
        const user = res.data;
        setFullName(user.name || '');
        setUsername(user.username || '');
        setDob(user.dob || '');
        setAbout(user.about || '');
        setPhone(user.phone || '');
        setEmail(user.email || '');
        setGender(user.gender || '');
        setCity(user.city || '');
        setCountry(user.country || '');
        setImage(user.profileImage || null);
        if (user.countryCode) setCountryCode(user.countryCode);
      })
      .catch(err => {
        // handle error
      });
  }, [userId]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) setImage(URL.createObjectURL(file));
  };

  // Save changes
  const handleSave = async () => {
    try {
      await axios.put(`/api/user/${userId}`, {
        name: fullName,
        username,
        dob,
        about,
        phone,
        email,
        gender,
        city,
        country,
        countryCode,
        // profileImage: image, // handle image upload separately if needed
      });
      alert('Profile updated!');
    } catch (err) {
      alert('Failed to update profile');
    }
  };

  return (
    <div
      style={{
        fontFamily: 'Poppins, sans-serif',
        backgroundColor: '#fff6f8',
        borderRadius: 0,
        padding: '.1rem',
        width: '100%',
        height: 'calc(100vh - 64px)',
        overflowY: 'auto',
        color: '#333',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontWeight: 'bold',
          marginBottom: '1.2rem',
        }}
      >
        <h2 style={{ margin: 0 }}>Edit Profile</h2>
        <button
          style={{ border: 'none', background: 'none', color: '#f06292', fontSize: '1rem' }}
          onClick={handleSave}
        >Save</button>
      </div>

      {/* Image */}
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <img
          src={image || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'}
          alt="Profile"
          style={{
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            objectFit: 'cover',
            border: '4px solid #f8bbd0',
          }}
        />
        <label htmlFor="image-upload" style={{ display: 'block', marginTop: '0.5rem', color: '#ec407a', fontWeight: 500, cursor: 'pointer' }}>
          Edit Profile Photo
        </label>
        <input id="image-upload" type="file" accept="image/*" onChange={handleImageChange} hidden />
      </div>

      {/* Inputs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Full Name + Username */}
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '1rem' }}>
          <input type="text" placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
          <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
        </div>

        {/* Country Code + Phone */}
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '1rem' }}>
          <select value={countryCode} onChange={(e) => setCountryCode(e.target.value)} style={{ ...inputStyle, flex: isMobile ? 'unset' : '0.3' }}>
            <option value="+91">+91</option>
            <option value="+1">+1</option>
            <option value="+44">+44</option>
          </select>

          <div style={{ position: 'relative', flex: 1 }}>
            <input
              type="tel"
              placeholder="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              style={{ ...inputStyle, width: '100%' }}
            />
            {phone.length === 10 ? (
              <span style={validStyle}>✅</span>
            ) : phone.length > 0 ? (
              <span style={invalidStyle}>❌</span>
            ) : null}
          </div>
        </div>

        {/* Date of Birth */}
        <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} style={inputStyle} />

        {/* City + Country */}
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '1rem' }}>
          <input type="text" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
          <input type="text" placeholder="Country" value={country} onChange={(e) => setCountry(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
        </div>

        {/* Gender */}
        <select value={gender} onChange={(e) => setGender(e.target.value)} style={inputStyle}>
          <option value="">Select Gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>

        {/* About */}
        <textarea
          placeholder="About (max 60 chars)"
          value={about}
          onChange={(e) => setAbout(e.target.value.slice(0, 60))}
          maxLength={60}
          style={{ ...inputStyle, height: '80px', resize: 'none' }}
        />

        {/* Email */}
        <div style={{ position: 'relative' }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ ...inputStyle, width: '100%' }}
          />
          {email.length > 0 && (
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? (
              <span style={validStyle}>✅</span>
            ) : (
              <span style={invalidStyle}>❌</span>
            )
          )}
        </div>
      </div>
    </div>
  );
};

const inputStyle = {
  padding: '0.75rem 1rem',
  border: '1px solid #eee',
  borderRadius: '12px',
  fontSize: '1rem',
  background: '#fff',
  color: '#333',
  fontFamily: 'Poppins, sans-serif',
  width: '100%',
  boxSizing: 'border-box',
};

const validStyle = {
  position: 'absolute',
  right: '1rem',
  top: '50%',
  transform: 'translateY(-50%)',
  color: 'green',
  fontSize: '1.2rem',
};

const invalidStyle = {
  position: 'absolute',
  right: '1rem',
  top: '50%',
  transform: 'translateY(-50%)',
  color: 'red',
  fontSize: '1.2rem',
};

export default EditProfile;
