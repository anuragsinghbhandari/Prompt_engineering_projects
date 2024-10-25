import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const ProjectListing = () => {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/projects');
        setProjects(response.data);
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    };

    fetchProjects();
  }, []);

  return (
    <div>
      <h2>Solar Projects</h2>
      {projects.map((project) => (
        <div key={project._id}>
          <h3>
            <Link to={`/projects/${project._id}`}>{project.name}</Link>
          </h3>
          <p>Location: {project.location}</p>
          <p>Capacity: {project.capacity} kW</p>
          <p>Expected Return: {project.expectedReturn}%</p>
          {/* Add more project details here */}
        </div>
      ))}
    </div>
  );
};

export default ProjectListing;
