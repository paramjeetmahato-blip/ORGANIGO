import { useNavigate } from "react-router-dom";
import "../styles/About.css";

function About() {
  const navigate = useNavigate();

  return (
    <div className="about-page">

      <div className="about-header">

        <button
          className="about-back"
          onClick={() => navigate(-1)}
        >
          ←
        </button>

        <h1>About ORGANIGO</h1>

      </div>

      <div className="about-detail-content">

        <div className="about-brand-card">
          <div className="about-brand-icon">🥬</div>

          <h2>ORGANIGO</h2>

          <p>Freshness Delivered to Your Doorstep.</p>
        </div>

        <section className="about-section">
          <h3>Who We Are</h3>

          <p>
            ORGANIGO is your everyday grocery shopping
            destination for fresh fruits, vegetables,
            dairy products, bakery items and daily essentials.
          </p>
        </section>

        <section className="about-section">
          <h3>Our Mission</h3>

          <p>
            Our mission is to make fresh and quality groceries
            easily accessible to every household with a
            convenient and reliable shopping experience.
          </p>
        </section>

        <section className="about-section">
          <h3>Our Commitment</h3>

          <p>
            We focus on freshness, quality, customer
            satisfaction and convenient doorstep delivery.
          </p>
        </section>

        <section className="about-section">
          <h3>Our Location</h3>

          <p>Chaibasa, Jharkhand, India.</p>
        </section>

        <div className="about-detail-footer">
          © {new Date().getFullYear()} ORGANIGO. All Rights Reserved.
        </div>

      </div>

    </div>
  );
}

export default About;