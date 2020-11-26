import { IUpdateUser, IUpdateUserData } from "../models/types";

/**
 * Service function object to get the user data
 * @param token
 */
export const fetchUser = (token: string) =>
  fetch(`/api/users/current`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Token " + token,
    },
  }).then(response => response.json());

/**
 * Service function object to update the user data
 * @param userData
 */
export const updateUser = (user: IUpdateUser, userData: IUpdateUserData) =>
  fetch(`/api/users/${user.id}`, {
    method: "PUT",
    body: JSON.stringify({ user: userData }),
    headers: {
      "Content-Type": "application/json",
      Authorization: "Token " + user.token,
    },
  }).then(response => response.json());

export const simulateKhouryLogin = () =>
  fetch(`/api/v1/admin_hook`, {
    method: "POST",
    body: JSON.stringify({
      email: "a.grob@northeastern.edu",
      is_advisor: false,
      major: "Computer Science, BSCS",
      first_name: "Alexander",
      last_name: "Grob",
      photo_url:
        "https://prod-web.neu.edu/wasapp/EnterprisePhotoService/PhotoServlet?vid=CCS&er=d1d26b1327817a8d34ce75336e0334cb78f33e63cf907ea82da6d6abcfc15d66244bb291baec1799cf77970e4a519a1cf7d48edaddb97c01",
    }),
    headers: {
      "Content-Type": "application/json",
    },
  }).then(response => response.json());
