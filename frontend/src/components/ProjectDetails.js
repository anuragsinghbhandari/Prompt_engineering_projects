import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const ProjectDetails = () => {
  const [project, setProject] = useState(null);
  const { id } = useParams();

  useEffect(() => {
    const fetchProjectDetails = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/projects/${id}`);
        setProject(response.data);
      } catch (error) {
        console.error('Error fetching project details:', error);
      }
    };

    fetchProjectDetails();
  }, [id]);

  if (!project) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h2>{project.name}</h2>
      <p>Location: {project.location}</p>
      <p>Capacity: {project.capacity} kW</p>
      <p>Expected Return: {project.expectedReturn}%</p>
      <p>Installation Details: {project.installationDetails}</p>
      <p>Timeline: {project.timeline}</p>
      <p>Power Output: {project.powerOutput} kWh/year</p>
      <p>Available Shares: {project.availableShares}</p>
      <p>Price per Share: ${project.pricePerShare}</p>
      {/* Add more project details here */}
    </div>
  );
};

export default ProjectDetails;
