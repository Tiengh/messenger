import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import { useQuery } from "@tanstack/react-query";
import { getStreamToken } from "../lib/api";

import {
  StreamVideo,
  StreamVideoClient,
  StreamCall,
  CallControls,
  SpeakerLayout,
  StreamTheme,
  CallingState,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";

import "@stream-io/video-react-sdk/dist/css/styles.css";

import toast from "react-hot-toast";
import PageLoader from "../components/PageLoader";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

const CallPage = () => {
  const { id: callId } = useParams(); // ✅ Đúng tên tham số
  const [client, setClient] = useState(null);
  const [call, setCall] = useState(null);
  const [isConnecting, setIsConnecting] = useState(true);

  const { authUser, isLoading } = useAuthUser();

  const { data: tokenData } = useQuery({
    queryKey: ["streamToken"],
    queryFn: getStreamToken,
    enabled: !!authUser,
  });

  useEffect(() => {
    const initCall = async () => {
      if (!tokenData?.token || !authUser || !callId) return;

      try {
        const user = {
          id: authUser._id,
          name: authUser.user_name,
          image: authUser.user_profilePic,
        };

        const videoClient = new StreamVideoClient({
          apiKey: STREAM_API_KEY,
          user,
          token: tokenData.token,
        });

        const callInstance = videoClient.call("default", callId);
        await callInstance.join({ create: true });

        setClient(videoClient);
        setCall(callInstance);
      } catch (error) {
        console.error("Error joining video call: ", error);
        toast.error("Cannot join the call. Try again.");
      } finally {
        setIsConnecting(false);
      }
    };

    initCall();
  }, [tokenData, authUser, callId]);

  if (isLoading || isConnecting) return <PageLoader />;

  return (
    <div className="h-screen flex flex-col items-center justify-center">
      <div className="relative w-full h-full">
        {client && call ? (
          <StreamVideo client={client}>
            <StreamCall call={call}>
              <CallContent />
            </StreamCall>
          </StreamVideo>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p>Could not initialize video call. Please try again.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const CallContent = () => {
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();
  const navigate = useNavigate();

  useEffect(() => {
    if (callingState === CallingState.LEFT) {
      navigate("/");
    }
  }, [callingState, navigate]);

  return (
    <StreamTheme>
      <SpeakerLayout/>
        <CallControls/>
    </StreamTheme>
  );
};

export default CallPage;
