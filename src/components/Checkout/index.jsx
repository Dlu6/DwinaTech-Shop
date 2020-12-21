import { useState, useEffect } from "react";
import {
  Step,
  Paper,
  Stepper,
  StepLabel,
  Container,
  Typography,
} from "@material-ui/core";
import { useHistory } from "react-router-dom";
import { commerce } from "../../lib/commerce";
import { renderRelatedComponent } from "./helpers";
import "./style.css";

const steps = ["order-address", "order-details", "order-payment"];

const convertObjectToArray = (countries) =>
  Object.entries(countries || {}).map(([code, name]) => ({ code, name }));

const Checkout = ({ basketData, orderInfo }) => {
  const [user, setUser] = useState({
    city: "",
    email: "",
    address: "",
    postCode: "",
    lastName: "",
    firstName: "",
    shippingOption: "",
    shippingOptions: [],
    shippingCountry: {},
    shippingCountries: [],
    shippingSubdivision: "",
    shippingSubdivisions: [],
  });
  const [bookingStep, setBookingStep] = useState("order-address");
  const [checkoutData, setCheckoutData] = useState("");

  useEffect(() => {
    const fetchShippingOptions = async (
      checkoutDataId,
      country,
      stateProvince = null
    ) => {
      const options = await commerce.checkout.getShippingOptions(
        checkoutDataId,
        {
          country,
          region: stateProvince,
        }
      );
      setUser({
        ...user,
        shippingOptions: options,
        shippingOption: options[0].id,
      });
    };
    if (user.shippingSubdivision && !user.shippingOptions.length)
      fetchShippingOptions(
        checkoutData.id,
        user.shippingCountry.code,
        user.shippingSubdivision.code
      );
  }, [
    user,
    checkoutData.id,
    user.shippingCountry.code,
    user.shippingSubdivision,
  ]);

  useEffect(() => {
    const fetchSubdivisions = async (countryCode) => {
      const { subdivisions } = await commerce.services.localeListSubdivisions(
        countryCode
      );
      const shippingSubdivisions = convertObjectToArray(subdivisions);
      setUser({
        ...user,
        shippingSubdivisions,
        shippingSubdivision: shippingSubdivisions[0],
      });
    };
    if (user.shippingCountry.code && !user.shippingSubdivisions.length)
      fetchSubdivisions(user.shippingCountry.code);
  }, [user]);

  useEffect(() => {
    const fetchShippingCountries = async () => {
      const { countries } = await commerce.services.localeListShippingCountries(
        checkoutData.id
      );
      const FormattedCountries = convertObjectToArray(countries);
      setUser({
        ...user,
        shippingCountries: FormattedCountries,
        shippingCountry: FormattedCountries[FormattedCountries.length - 1],
      });
    };
    if (!user.shippingCountries.length) {
      fetchShippingCountries();
    }
  }, [user, checkoutData]);

  const history = useHistory();

  const handleSubmit = (e) => {
    e.preventDefault();
    setBookingStep("order-details");
  };

  const handleNextStep = (e, step) => {
    e.preventDefault();
    setBookingStep(step);
  };

  const handleBackStep = (e, step) => {
    e.preventDefault();
    setBookingStep(step);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser({ ...user, [name]: value });
  };

  useEffect(() => {
    const generateToken = async () => {
      try {
        const response = await commerce.checkout.generateToken(basketData.id, {
          type: "cart",
        });
        setCheckoutData(response);
      } catch (error) {
        if (error && bookingStep !== 1) history.push("/");
      }
    };
    if (!checkoutData.live) {
      generateToken();
    }
  }, [checkoutData, basketData, bookingStep, history]);

  if (!checkoutData.live) {
    return null;
  }

  return (
    <div className="checkout">
      <Container>
        <Paper className="paper" elevation={3}>
          <Typography align="center" variant="h5" gutterBottom>
            Checkout
          </Typography>
          {bookingStep !== "confirmation" && (
            <Stepper
              className="stepper"
              activeStep={steps.indexOf(bookingStep)}
            >
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          )}
          {renderRelatedComponent({
            user,
            orderInfo,
            bookingStep,
            handleChange,
            handleSubmit,
            checkoutData,
            handleBackStep,
            handleNextStep,
          })}
        </Paper>
      </Container>
    </div>
  );
};

export default Checkout;