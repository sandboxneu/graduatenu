import { API } from "@graduate/api-client";
import { useRouter } from "next/router";
import React, { useEffect } from "react";
import { toast } from "../utils";
import { NextPage } from "next";

const ConfirmEmail: NextPage = () => {
  const router = useRouter();
  const token = router.query.token as string;

  useEffect(() => {
    if (token) {
      const sendJWTToken = async () => {
        try {
          await API.email.confirm({ token });
          router.push("/home");
        } catch (err) {
          toast.error("Something went wrong, try registering again");
          console.error(err);
        }
      };
      sendJWTToken();
    }
  }, [router, token]);
  return <div>confirmEmail</div>;
};

export default ConfirmEmail;
