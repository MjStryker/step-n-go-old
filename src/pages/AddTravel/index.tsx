import React from "react";

// Components
import TravelNameForm from "./TravelNameForm";
import TravelCategoryForm, { TravelCategories } from "./TravelCategoryForm";
import TravelDepartureAndDestinationForm from "./TravelDepartureAndDestinationForm";
import TravelTransportAndHousingForm from "./TravelTransportAndAccommodationForm";
import {
  TravelContext,
  defaultTravel,
  TravelType
} from "../Travel/TravelContext";

import { DisplayResolution } from "../../components/DisplayResolution";
import { isStringValid, areStringsValid } from "../../scripts/inputTests";
import { Link } from "react-router-dom";

// Material-ui
import { makeStyles, Theme, createStyles } from "@material-ui/core/styles";
import Stepper from "@material-ui/core/Stepper";
import Step from "@material-ui/core/Step";
import StepButton from "@material-ui/core/StepButton";
import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";
import Box from "@material-ui/core/Box";
import Container from "@material-ui/core/Container";
import Hidden from "@material-ui/core/Hidden";
import { TransportType } from "./TravelTransportForm";
import { AccommodationType } from "./TravelAccommodationForm";
import { PATH_TRAVEL } from "../Travel";

export const PATH_ADD_TRAVEL = "/addTravel";

const steps = [
  "Nom du voyage",
  "Type de voyage",
  "Départ / Destination",
  "Transport / Hébergement"
];

function totalSteps(): number {
  return steps.length;
}

function getStepContent(step: number): JSX.Element {
  switch (step) {
    case 0:
      return <TravelNameForm />;
    case 1:
      return <TravelCategoryForm />;
    case 2:
      return <TravelDepartureAndDestinationForm />;
    case 3:
      return <TravelTransportAndHousingForm />;
    default:
      return <p>Unknown step</p>;
  }
}

const useStateWithLocalStorage = (
  localStorageKey: string,
  defaultValue: {} | []
) => {
  const [value, setValue] = React.useState<any>(
    !!localStorage.getItem(localStorageKey)
      ? JSON.parse(localStorage.getItem(localStorageKey) as string)
      : defaultValue
  );

  React.useEffect(() => {
    localStorage.setItem(localStorageKey, JSON.stringify(value));
  }, [localStorageKey, value]);

  return [value, setValue];
};

const AddTravel = () => {
  const classes = useStyles();
  const [travel, setTravel] = useStateWithLocalStorage("travel", defaultTravel);
  const [activeStep, setActiveStep] = useStateWithLocalStorage(
    "currentStep",
    0
  );
  const [completed, setCompleted] = useStateWithLocalStorage("stepsCompleted", [
    false,
    false,
    false,
    false
  ]);

  // FIXME: Find solution to remove this line (localstorage won't update the stepsCompleted stored value)
  localStorage.setItem("stepsCompleted", JSON.stringify(completed));

  const updateTravel = React.useMemo(
    () => (newTravel: TravelType) => {
      setTravel(newTravel);
    },
    [setTravel]
  );

  const travelProviderValue = React.useMemo(() => ({ travel, updateTravel }), [
    travel,
    updateTravel
  ]);

  function completedSteps() {
    return completed.filter((isStepCompleted: boolean) => isStepCompleted)
      .length;
  }

  function isLastStep() {
    return activeStep === totalSteps() - 1;
  }

  function allStepsCompleted() {
    return completedSteps() === totalSteps();
  }

  function handleNext() {
    const newActiveStep = !allStepsCompleted()
      ? // It's the last step, but not all steps have been completed,
        // find the first step that has been completed
        // steps.findIndex((step, i) => !(i in completed))
        isLastStep()
        ? completed.indexOf(false)
        : completed.findIndex((e: boolean, index: number) => {
            return index > activeStep && e === false;
          })
      : activeStep + 1;
    setActiveStep(newActiveStep);
  }

  function handleBack() {
    setActiveStep((prevActiveStep: number) => prevActiveStep - 1);
    // setCompleted({ ...completed, [activeStep - 1]: false });
  }

  const handleStep = (step: number) => () => {
    setActiveStep(step);
    const newCompleted = completed;
    completed[activeStep] = isStepValid();
    setCompleted(newCompleted);
  };

  function handleComplete() {
    const newCompleted = completed;
    completed[activeStep] = isStepValid();
    setCompleted(newCompleted);
    handleNext();
  }

  function handleReset() {
    setActiveStep(0);
    setCompleted({});
  }

  function isStepValid(): boolean {
    switch (activeStep) {
      case 0:
        return !!travel.name && isStringValid(travel.name);
      case 1:
        return !!travel.category && TravelCategories.includes(travel.category);
      case 2:
        return areStringsValid([
          ...Object.values(travel.departure),
          ...Object.values(travel.destination)
        ]);
      case 3:
        return (
          travel.transports.filter((t: TransportType) => {
            console.log(areStringsValid([t.depDate, t.arrDate]));
            return areStringsValid([t.depDate, t.arrDate]);
          }).length > 0
        );

      // isStringValid(travel.transports[0].depLocation);

      // travel.transports.map((t: TransportType) =>
      //   isStringValid(t.depLocation)
      // );
      // &&
      // travel.accommodations.map((a: AccommodationType) =>
      //   areStringsValid([a.accommodation, a.location])
      // )
      default:
        return false;
    }
  }

  return (
    <TravelContext.Provider value={travelProviderValue}>
      <div className={classes.root}>
        <div style={{ backgroundColor: "#fff" }}>
          <Container>
            <Stepper
              nonLinear
              activeStep={activeStep}
              className={classes.stepper}
            >
              {steps.map((label, index) => (
                <Step key={label}>
                  <StepButton
                    onClick={handleStep(index)}
                    completed={completed[index]}
                    // disabled={!isStepValid()}
                  >
                    <Hidden xsDown>{label}</Hidden>
                  </StepButton>
                </Step>
              ))}
            </Stepper>
          </Container>
        </div>
        <>
          <Typography style={{ textAlign: "center" }}>{travel.id}</Typography>
          <Container className={classes.stepContainer}>
            {getStepContent(activeStep)}
          </Container>
          <Box className={classes.actionsButtonsContainer}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              className={classes.button}
            >
              Précédent
            </Button>
            {(completedSteps() === totalSteps() - 1 &&
              !completed[activeStep]) ||
            allStepsCompleted() ? (
              <Button
                disabled={!isStepValid()}
                variant="contained"
                color="primary"
                className={classes.button}
                component={Link}
                to={PATH_TRAVEL}
              >
                Terminer
              </Button>
            ) : (
              <Button
                disabled={!isStepValid()}
                variant="contained"
                color="primary"
                // onClick={handleNext}
                onClick={handleComplete}
                className={classes.button}
              >
                {/* {completedSteps() === totalSteps() - 1 || allStepsCompleted()
                  ? "Terminer"
                  : "Continuer"} */}
                Continuer
                {/* {isLastStep() ? "Terminer" : "Continuer"} */}
              </Button>
            )}
            {/* {activeStep !== steps.length &&
                (completed[activeStep] ? (
                  <Typography variant="caption" className={classes.completed}>
                    Step {activeStep + 1} already completed
                  </Typography>
                ) : (
                  <>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleComplete}
                    >
                      {completedSteps() === totalSteps() - 1
                        ? "Terminer"
                        : "Continuer"}
                    </Button>
                  </>
                ))} */}
          </Box>
        </>
      </div>
      <DisplayResolution />
    </TravelContext.Provider>
  );
};

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      width: "100%"
    },
    stepper: {
      marginBottom: theme.spacing(4),
      [theme.breakpoints.down("sm")]: {
        marginBottom: theme.spacing(2)
      }
    },
    button: {
      marginTop: theme.spacing(2),
      marginRight: theme.spacing(1)
    },
    completed: {
      display: "inline-block"
    },
    instructions: {
      marginTop: theme.spacing(1),
      marginBottom: theme.spacing(1)
    },
    stepContainer: {
      [theme.breakpoints.up("sm")]: {
        minHeight: "300px"
      },
      display: "flex",
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: theme.spacing(4)
    },
    actionsButtonsContainer: {
      display: "flex",
      flexDirection: "row",
      justifyContent: "center",
      marginTop: theme.spacing(-2),
      marginBottom: theme.spacing(4)
    }
  })
);

export default AddTravel;
