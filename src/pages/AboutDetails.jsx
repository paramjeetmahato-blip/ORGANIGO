import { useNavigate, useParams } from "react-router-dom";
import "../styles/About.css";

// ======================================
// ORGANIGO - ALL INFORMATION PAGES
// ======================================

const aboutContent = {
  // TERMS OF SERVICE
  terms: {
    title: "Terms of Service",
    sections: [
      {
        heading: "1. Introduction",
        text: "Welcome to ORGANIGO. These terms explain the conditions for using our grocery ordering platform.",
      },
      {
        heading: "2. Using ORGANIGO",
        text: "Customers can browse available products, add products to their cart and place orders through the platform. Please provide accurate contact and delivery information.",
      },
      {
        heading: "3. Product Availability",
        text: "All products are subject to availability. Prices, product details and stock may change without prior notice.",
      },
      {
        heading: "4. Orders",
        text: "An order is subject to confirmation by ORGANIGO. We may contact customers if a product is unavailable or an order requires clarification.",
      },
      {
        heading: "5. Delivery",
        text: "Delivery time may vary depending on location, product availability, weather and operational conditions.",
      },
      {
        heading: "6. Customer Responsibility",
        text: "Customers should provide correct delivery details and remain available to receive their orders.",
      },
      {
        heading: "7. Changes to Terms",
        text: "ORGANIGO may update these terms when required. Updated terms will be published on this page.",
      },
    ],
  },

  // PRIVACY POLICY
  privacy: {
    title: "Privacy Policy",
    sections: [
      {
        heading: "1. Information We Collect",
        text: "ORGANIGO may collect information such as your name, mobile number, delivery address, order details and account information.",
      },
      {
        heading: "2. How We Use Information",
        text: "Information is used to manage accounts, process orders, arrange deliveries, provide customer support and improve our services.",
      },
      {
        heading: "3. Information Sharing",
        text: "Relevant order and delivery information may be shared with authorized personnel involved in fulfilling your order.",
      },
      {
        heading: "4. Data Security",
        text: "We take reasonable steps to protect customer information against unauthorized access, misuse or disclosure.",
      },
      {
        heading: "5. Data Retention",
        text: "Information may be retained for as long as necessary for order management, business operations and applicable legal requirements.",
      },
      {
        heading: "6. Contact",
        text: "For privacy-related questions, please contact ORGANIGO through its official customer support channel once published.",
      },
    ],
  },

  // REFUND & CANCELLATION
  refund: {
    title: "Refund & Cancellation Policy",
    sections: [
      {
        heading: "1. Order Cancellation",
        text: "Customers may request cancellation before an order is dispatched. Cancellation may not be possible after dispatch.",
      },
      {
        heading: "2. Damaged or Incorrect Products",
        text: "If you receive a damaged, defective or incorrect product, contact customer support as soon as possible with your order details.",
      },
      {
        heading: "3. Missing Products",
        text: "If an item is missing from your order, report the issue to customer support for verification.",
      },
      {
        heading: "4. Refund Processing",
        text: "Approved refunds will be processed through the applicable payment method or another mutually agreed method.",
      },
      {
        heading: "5. Cash on Delivery",
        text: "For cash-on-delivery orders, any approved refund will be coordinated through customer support.",
      },
      {
        heading: "6. Important Note",
        text: "Refund eligibility and timelines will depend on order status, the nature of the complaint and applicable consumer protection requirements.",
      },
    ],
  },

  // HELP CENTER
  help: {
    title: "Help Center",
    sections: [
      {
        heading: "How can we help you?",
        text: "ORGANIGO is here to help you with products, orders, payments and deliveries.",
      },
      {
        heading: "Shopping Help",
        text: "Browse fresh products, add your favourite items to cart and place your order.",
      },
      {
        heading: "Account Help",
        text: "Sign in to manage your account, addresses and order history.",
      },
      {
        heading: "Need More Help?",
        text: "Please contact ORGANIGO customer support when the official support channel becomes available.",
      },
    ],
  },

  // FREQUENTLY ASKED QUESTIONS
  faqs: {
    title: "Frequently Asked Questions",
    sections: [
      {
        heading: "1. What is ORGANIGO?",
        text: "ORGANIGO is a grocery shopping platform for fresh fruits, vegetables and daily essentials.",
      },
      {
        heading: "2. Where does ORGANIGO deliver?",
        text: "Our initial delivery service is planned for Chaibasa, Jharkhand.",
      },
      {
        heading: "3. How can I place an order?",
        text: "Browse products, add them to your cart and proceed to checkout.",
      },
      {
        heading: "4. How can I track my order?",
        text: "You can check your order status from the My Orders section.",
      },
      {
        heading: "5. Can I cancel my order?",
        text: "Cancellation depends on the current order status. Please refer to our Refund & Cancellation Policy.",
      },
    ],
  },

  // ORDER SUPPORT
  "order-support": {
    title: "Order Support",
    sections: [
      {
        heading: "Order Assistance",
        text: "For assistance with an order, keep your Order ID ready.",
      },
      {
        heading: "Missing Products",
        text: "Contact customer support if any product is missing from your delivery.",
      },
      {
        heading: "Damaged Products",
        text: "Report damaged or incorrect products as soon as possible.",
      },
      {
        heading: "Order Status",
        text: "Visit My Orders to check your order status.",
      },
    ],
  },

  // DELIVERY INFORMATION
  delivery: {
    title: "Delivery Information",
    sections: [
      {
        heading: "Delivery Location",
        text: "ORGANIGO is initially planned to serve customers in Chaibasa, Jharkhand.",
      },
      {
        heading: "Delivery Time",
        text: "Delivery times may vary depending on location, product availability and operational conditions.",
      },
      {
        heading: "Delivery Charges",
        text: "Applicable delivery charges, if any, will be displayed during checkout.",
      },
      {
        heading: "Receiving Your Order",
        text: "Please ensure that someone is available at the delivery address to receive the order.",
      },
    ],
  },

  // OPEN SOURCE LIBRARIES
  "open-source": {
    title: "Open Source Libraries",
    sections: [
      {
        heading: "React",
        text: "Used to build the ORGANIGO user interface.",
      },
      {
        heading: "React Router",
        text: "Used for navigation between application pages.",
      },
      {
        heading: "Vite",
        text: "Used as the frontend development and build tool.",
      },
      {
        heading: "Express",
        text: "Used for backend API development.",
      },
      {
        heading: "Mongoose",
        text: "Used to interact with MongoDB databases.",
      },
    ],
  },

  // LICENSES AND REGISTRATIONS
  licenses: {
    title: "Licenses and Registrations",
    sections: [
      {
        heading: "Business Information",
        text: "Official business identity and registration details will be published here after verification.",
      },
      {
        heading: "GST Registration",
        text: "GST registration details: To be added if applicable and obtained.",
      },
      {
        heading: "FSSAI Registration",
        text: "Applicable food business registration details: To be added after verification, if required.",
      },
      {
        heading: "Other Licenses",
        text: "Other applicable business licenses and registrations will be listed here once obtained and verified.",
      },
    ],
  },

  // CONTACT US
  contact: {
    title: "Contact Us",
    sections: [
      {
        heading: "Customer Support",
        text: "For help with orders, delivery, products or account-related issues, please use the official ORGANIGO support channel once it is available.",
      },
      {
        heading: "Order Support",
        text: "Please keep your order ID ready when contacting support about an order.",
      },
      {
        heading: "Business Address",
        text: "Official business address: To be added.",
      },
      {
        heading: "Email",
        text: "Official support email: To be added.",
      },
      {
        heading: "Phone",
        text: "Official customer support number: To be added.",
      },
    ],
  },
};

// ======================================
// ABOUT DETAILS PAGE
// ======================================

function AboutDetails() {
  const navigate = useNavigate();
  const { section } = useParams();

  const content = aboutContent[section];

  // PAGE NOT FOUND
  if (!content) {
    return (
      <div className="about-page">
        <div className="about-header">
          <button
            className="about-back"
            onClick={() => navigate("/about")}
            aria-label="Go back"
          >
            ←
          </button>

          <h1>Page Not Found</h1>
        </div>

        <div className="about-content">
          <p>This page is not available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="about-page">

      {/* PAGE HEADER */}
      <div className="about-header">
        <button
          className="about-back"
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          ←
        </button>

        <h1>{content.title}</h1>
      </div>

      {/* PAGE CONTENT */}
      <div className="about-detail-content">

        {/* ORGANIGO BRAND CARD */}
        <div className="about-brand-card">
          <div className="about-brand-icon">🌿</div>

          <h2>ORGANIGO</h2>

          <p>Freshness Delivered to Your Doorstep.</p>
        </div>

        {/* INFORMATION SECTIONS */}
        {content.sections.map((item, index) => (
          <section className="about-section" key={index}>
            <h3>{item.heading}</h3>

            <p>{item.text}</p>
          </section>
        ))}

        {/* FOOTER */}
        <div className="about-detail-footer">
          © {new Date().getFullYear()} ORGANIGO. All Rights Reserved.
        </div>

      </div>
    </div>
  );
}

export default AboutDetails;