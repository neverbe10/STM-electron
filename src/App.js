import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import "date-fns";
import { format } from "date-fns";
import DateFnsUtils from "@date-io/date-fns";
import addMonths from "date-fns/addMonths";
import Select from "@material-ui/core/Select";
import FormControl from "@material-ui/core/FormControl";
import MenuItem from "@material-ui/core/MenuItem";
import InputLabel from "@material-ui/core/InputLabel";
import Button from "@material-ui/core/Button";
import {
  KeyboardDatePicker,
  MuiPickersUtilsProvider,
} from "@material-ui/pickers";
const electron = window.require("electron");
const ipcRenderer = electron.ipcRenderer;

import SnowContainer from "./SnowContainer";
import venmo from "./venmo.jpg";
import LoadingIndicator from "./LoadingIndicator";

const GreenDot = (
  <svg
    width="24"
    height="24"
    viewBox="0 0 31 31"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="15.5" cy="15.5" r="15.5" fill="#3EDB4E" fill-opacity="0.9" />
  </svg>
);

const GreyDot = (
  <svg
    width="24"
    height="24"
    viewBox="0 0 31 31"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="15.5" cy="15.5" r="15.5" fill="#959995" fill-opacity="0.9" />
  </svg>
);

function Donate() {
  const ref = useRef();
  useEffect(() => {
    if (ref && ref.current) {
      const button = document.getElementById("buymeacoffee");
      if (button) {
        button.style.display = "";
        ref.current.appendChild(button);
      }
    }
  }, [ref]);

  return <div ref={ref} />;
}

export default function App() {
  const [choosenDate, setChoosenDate] = useState(
    format(new Date(), "MM/dd/yyyy")
  );
  const [resort, setResort] = useState("");
  const [resortList, setResortList] = useState([]);
  const [isAvailable, setIsAvailable] = useState(false);
  const [resortUrl, setResortUrl] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [start, setStart] = useState(false);
  const maxDate = addMonths(new Date(), 3);

  useEffect(() => {
    if (window.location.hostname !== "localhost") {
      window.dataLayer = window.dataLayer || [];
      function gtag() {
        dataLayer.push(arguments);
      }
      gtag("js", new Date());
      gtag("config", "G-9MRSPLM5TY");
    }
  }, []);

  useEffect(() => {
    setResortList(ipcRenderer.sendSync("resort-list"));
  }, [setResortList]);

  useEffect(() => {
    if (choosenDate && resort) {
      const res = ipcRenderer.sendSync("availability", resort, choosenDate);
      // TODO: if null!!!
      if (!res.remaining) {
      }
      setIsAvailable(res.remaining > 0 || false);
      setResortUrl(res.resortUrl || "");
    }
  }, [resort, choosenDate, setIsAvailable]);

  useEffect(() => {
    let timeout;
    if (start) {
      timeout = setTimeout(() => {
        const res = ipcRenderer.sendSync("ready");
        setIsReady(res);
      }, 3000);
    }
    return () => clearTimeout(timeout);
  }, [start]);

  const handleDateChange = (date) => {
    setChoosenDate(date);
  };

  const handleScraping = () => {
    ipcRenderer.send("scrape", resortUrl);
    setStart(true);
  };

  // const handleButtonClick = () => {
  //   ipcRenderer.sendSync('scrape', 'stevens');
  // }

  // const handleSubscribe = async () => {
  //   if (choosenDate && resort) {
  //     if (!isLoading) {
  //       setIsLoading(true);
  //       // await axios.post(`/subscribe`, {
  //       //   phoneNumber,
  //       //   choosenDate,
  //       //   resort,
  //       // });
  //       setIsLoading(false);
  //     }
  //   }
  // };

  let availability;

  console.log({
    choosenDate,
    resort,
    isAvailable,
    choosenDate,
    resortList,
  });

  if (!start) {
    availability = null;
  } else if (start && !isReady) {
    availability = <LoadingIndicator />;
  } else if (!choosenDate || !resort) {
    availability = (
      <Availability>
        <DisabledText>Current Availability: - - - - - - - - - </DisabledText>
      </Availability>
    );
  } else if (isAvailable) {
    availability = (
      <Availability>
        <p>
          Current Availability: <DotWrapper>{GreenDot}</DotWrapper>
          {` `}(tickets available)
        </p>
        <i>
          Get Tickt:{" "}
          <a href={resortUrl} target="_blank" rel="noopener noreferrer">
            here
          </a>
        </i>
      </Availability>
    );
  } else {
    availability = (
      <Availability>
        <p>
          Current Availability: <DotWrapper>{GreyDot}</DotWrapper>
          {` `}(no tickets remaining)
        </p>
      </Availability>
    );
  }

  return (
    <div>
      <PageWrapper>
        <Donate />
        <h1>Ski Ticket Monitor</h1>
        <p>
          <em>Go Skiing Every Weekend</em>
        </p>
        <Selectors>
          <MuiPickersUtilsProvider utils={DateFnsUtils}>
            <KeyboardDatePicker
              disableToolbar
              variant="inline"
              format="MM/dd/yyyy"
              margin="normal"
              id="date-picker-inline"
              label="Day On The Slope"
              value={choosenDate}
              onChange={handleDateChange}
              KeyboardButtonProps={{
                "aria-label": "change date",
              }}
              maxDate={maxDate}
              fullWidth
              disablePast
            />
          </MuiPickersUtilsProvider>
          <Selector>
            <FormControl fullWidth disabled={resortList.length === 0}>
              <InputLabel id="demo-simple-select-label">Resort</InputLabel>
              <Select
                labelId="demo-simple-select-label"
                id="demo-simple-select"
                value={resort}
                onChange={(event) => setResort(event.target.value)}
              >
                {resortList &&
                  resortList.map((resort, index) => (
                    <MenuItem value={resort} key={index}>
                      {resort}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Selector>
        </Selectors>
        {!start && (
          <Button
            variant="contained"
            color={"primary"}
            onClick={handleScraping}
            style={{ marginTop: "10px" }}
          >
            Start Scrapping
          </Button>
        )}

        {availability}

        <Subscribe>
          <h3>Notification</h3>
          <p>Your will get a Notification when there is a ticket available</p>
        </Subscribe>
        <p className="disclaimer">
          <em>This website is not run by or affiliated with Vail Resorts</em>
        </p>
        <SnowContainer />
      </PageWrapper>
      <PageWrapper>
        <h1>My Story</h1>
        <p className={"story"}>
          Skiing is one of my favorite activities of the winter season. I was
          itching to get back outside and enjoy some fresh powder after spending
          nearly a year cooped up at home. I took a day off from work and went
          skiing with my friends at Stevens Pass Resort. It was amazing.
        </p>

        <p className={"story"}>
          Like so many others, I didn’t have plans for Christmas this year. I
          spent the week before Christmas looking for some fun activities. My
          friend invited me to a two day skiing trip with her. She already had
          her tickets. Because the weather forecast called for clouds, I was
          concerned about safety, so I told her that I would think about it. The
          next morning, I told her I decided to go. Unfortunately, she told me
          the tickets are all gone. Was I going to be stuck at home for
          Christmas? I spent all day refreshing the website, hoping to get a
          ticket. Right when I was about to give up, I thought, “Why don’t I
          write a small application to notify me when a slot opens up?”
        </p>

        <p className={"story"}>
          I was on vacation (which had piled up due to COVID), so I had plenty
          of free time, and I was eager to go skiing with my friend. With a lot
          of help from Stack Overflow, I wrote a simple app and was able to get
          tickets that same day. I was psyched!
        </p>

        <p className={"story"}>
          After I returned from the skiing trip, I was excited to take this
          little project further. Maybe I could help other people in the same
          position get tickets, too! Taking time off from work to go skiing in
          the middle of the week is a luxury that only some can afford. I think
          we should all be able to go skiing every weekend.{" "}
        </p>

        <p className={"story"}>
          I’m paying the domain, Twilio (SMS), and server fees out of pocket,
          and I’ve spent a lot of time on this. I am working to add more resorts
          as fast as I can. Every bit of support I get makes a big difference
          for me, so please consider making a small donation, if you can.
        </p>

        <Donate />
        <img src={venmo} width={244} />

        <p className={"story"}>
          See you on the slopes,
          <br />
          10Chen <br />
          Jan 8th, 2020
        </p>
      </PageWrapper>
    </div>
  );
}

const PageWrapper = styled("div")`
  background-color: rgba(255, 255, 255, 0.9);
  padding: 12px 24px;
  margin: 80px auto;
  display: flex;
  max-width: 400px;
  border-radius: 4px;
  flex-direction: column;
  align-items: center;

  > div:first-child {
    position: absolute;
    top: 32px;
    right: 16px;
  }

  h1 {
    font-size: 36px;
    font-family: "Kalam", cursive;
    margin-bottom: 0;
  }

  h1 + p {
    margin-top: 6px;
  }

  .disclaimer {
    color: #999999;
  }

  .story {
    font-family: "Kalam", cursive;
    color: #2e2e2e;
  }
`;

const Selectors = styled("div")`
  display: flex;
  flex-direction: row;
  border-bottom: 1px solid #ccc !important;
  min-width: 335px;
`;

const Selector = styled("div")`
  margin-top: 16px;
  margin-left: 8px;
  margin-bottom: 12px;
  min-width: 120px;
`;

const Availability = styled("div")`
  border-bottom: 1px solid #ccc !important;
  margin: 16px;
  display: flex;
  align-items: center;
  min-height: 80px;
  flex-direction: column;
  justify-content: center;
  i {
    font-size: 12px;
  }
  p {
    margin: 8px 0;
  }
  min-width: 335px;
`;

const Subscribe = styled("div")`
  margin-bottom: 24px;
  width: 335px;
  h3 {
    margin-bottom: 8px;
  }
  p {
    margin-bottom: 16px;
    margin-top: 8px;
    font-size: 14px;
    color: grey;
  }
`;

const DotWrapper = styled("span")`
  vertical-align: middle;
`;

const DisabledText = styled("p")`
  :hover {
    cursor: not-allowed;
  }
  color: grey;
`;
