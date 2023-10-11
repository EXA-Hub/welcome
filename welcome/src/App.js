import React, { useState, useEffect } from "react";
import "./App.css";
import MainPage from "./components/MainPage/MainPage";
import axios from 'axios';
import { Container, Row, Col, Spinner } from 'react-bootstrap';
import { FaShieldAlt } from 'react-icons/fa';


class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, errorMessage: error.toString() };
  }

  componentDidCatch(error, info) {
    // You can still log the error details to the console for debugging
    console.log(error, info);
  }

  render() {
    if (this.state.hasError) {
      // Render any custom fallback UI with the error message
      return <p>{this.state.errorMessage}</p>;
    }

    return this.props.children;
  }
}

function App() {
  const [ip, setIp] = useState(null);
  const [isListed, setIsListed] = useState(false);

  useEffect(() => {
    axios.get('https://api.ipify.org?format=json')
      .then((response) => {
        setIp(response.data.ip);
        fetch('/ips.json')
          .then(response => response.json())
          .then(data => {
            setIsListed(data.includes(response.data.ip));
          });
      })
      .catch((error) => {
        console.error("Error: ", error);
      });
  }, []);

  if (!ip || !isListed) {
    return (
      <Container fluid style={{ backgroundColor: '#202022', height: '100vh', color: '#CACACA' }} className="d-flex flex-column justify-content-center align-items-center">
        <Row>
          <Col md={{ span: 8, offset: 2 }} className="text-center">
            <FaShieldAlt color="#878787" size={50} />
            <h2 className="mt-3">Waiting for the security report</h2>
            <p>The backend server is checking your IP address.</p>
          </Col>
        </Row>
        <Row>
          <Col md={{ span: 8, offset: 2 }} className="text-center">
            <Spinner animation="border" role="status" />
            <div id="load">
              <div>G</div>
              <div>N</div>
              <div>I</div>
              <div>D</div>
              <div>A</div>
              <div>O</div>
              <div>L</div>
            </div>
          </Col>
        </Row>
      </Container>
    );
  } else {
    return (
      <ErrorBoundary>
        <div id="body">
          <MainPage />
        </div>
      </ErrorBoundary>
    );
  }
}

export default App;