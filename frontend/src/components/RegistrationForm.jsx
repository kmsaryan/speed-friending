import React, { useState } from 'react';
import { registerPlayer } from '../api/api';

const RegistrationForm = () => {
    const [formData, setFormData] = useState({
        name: '',
        gender: '',
        interests: '',
        preferences: '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const response = await registerPlayer(formData);
        if (response.playerId) {
            alert(`Player registered with ID: ${response.playerId}`);
        } else {
            alert('Error registering player.');
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <input name="name" placeholder="Name" onChange={handleChange} required />
            <input name="gender" placeholder="Gender" onChange={handleChange} />
            <input name="interests" placeholder="Interests" onChange={handleChange} />
            <input name="preferences" placeholder="Preferences" onChange={handleChange} />
            <button type="submit">Register</button>
        </form>
    );
};

export default RegistrationForm;
