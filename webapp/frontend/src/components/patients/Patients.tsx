import { Button } from "@mui/material";
import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";

import Toolbar from "@mui/material/Toolbar";
import { API } from "aws-amplify";
import { useEffect, useRef, useState } from "react";
import { getPatientsDetail, getUsersDetail, listPatientsDetails } from "../../common/graphql/queries";
import { onCreatePatientsDetail } from "../../common/graphql/subscriptions";
import { PatientsDetail, UsersDetail } from "../../common/types/API";
import CreatePatient from "./CreatePatient";
import DownloadData from "./DownloadData";
import EditPatient from "./EditPatient";
import ManageSensors from "./ManageSensors";
import ManageUsers from "./ManageUsers";

import "./patients.css";

export const Patients = (props: { userDetail: UsersDetail, userName: any, userId: any }) => {
    const [items, updateItems] = useState<Array<PatientsDetail>>(new Array<PatientsDetail>());
    const [loading, setLoading] = useState<boolean>(true);
    const stateRef = useRef<Array<PatientsDetail>>();
    stateRef.current = items;

    useEffect(() => {

        async function subscribeCreateEvents() {
            const subscription: any = API.graphql({
                query: onCreatePatientsDetail
            });

            subscription.subscribe({
                next: (data: any) => {
                    console.log("data received from create subscription:", data);
                    const newItems = [];
                    let found = false;
                    if (data.value.data) {
                        for (let item of stateRef.current!) {
                            if (data.value.data.onCreatePatientsDetail.patientId === item.patient_id) {
                                // Found existing item so we will update this item
                                newItems.push(data.value.data.onCreatePatientsDetail);
                                found = true;
                            } else {
                                // Keep existing item
                                newItems.push(item);
                            }
                        }
                        if (!found) {
                            newItems.push(data.value.data.onCreatePatientsDetail);
                        }
                        updateItems(newItems);
                    }
                },
                error: (error: any) => console.warn(error)
            });
        };

        async function callListAllEvents() {
            try {
                // const userDetailObj: any = await API.graphql({
                //     query: getUsersDetail,
                //     variables: {
                //         userId: props.userId,
                //     }
                // });
                // console.log(userDetailObj);
                // const userDetail: UsersDetail = userDetailObj['data']['getUsersDetail'];

                // Get the patients that this user cares for or all patients if admin
                let patientDetails: Array<PatientsDetail> = [];
                if (props.userDetail.user_type === "ADMIN") {
                    const userDetailObj: any = await API.graphql({
                        query: listPatientsDetails,
                        variables: {}
                    });
                    console.log(userDetailObj);
                    patientDetails = userDetailObj['data']['listPatientsDetails']['items'];
                } else {
                    if (props.userDetail.patient_ids) {
                        for (const patient_id of props.userDetail.patient_ids) {
                            const patientDetailObj: any = await API.graphql({
                                query: getPatientsDetail,
                                variables: {
                                    patientId: patient_id,
                                }
                            });
                            const patientDetail: PatientsDetail = patientDetailObj["data"]["getPatientsDetail"];
                            patientDetails.push(patientDetail);
                        }
                    }
                }

                setLoading(false);
                console.log('patientDetails:', patientDetails);
                updateItems(patientDetails);
            } catch (e) {
                setLoading(false);
                console.log('getUsersDetail errors:', e);
            }
        }

        if (Object.keys(props.userDetail).length > 0) {
            callListAllEvents()
            subscribeCreateEvents()
        }
    }, []);


    return (
        <Box sx={{ display: "flex" }}>
            <CssBaseline />

            <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
                <Toolbar />
                <TableContainer component={Paper}>
                            <Table sx={{ minWidth: 650 }} aria-label="caption table">
                                {
                                    items.length == 0 && <caption>No patients found - create a patient.</caption>
                                }
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Patient Name</TableCell>
                                        <TableCell>Patient ID</TableCell>
                                        <TableCell>Caregivers</TableCell>
                                        <TableCell>Sensors</TableCell>
                                        <TableCell>Download Data</TableCell>
                                        <TableCell align="right">
                                            {(props.userDetail.user_type === "ADMIN") &&
                                            <CreatePatient user={props.userDetail} />}
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {items.map((row) => (
                                        <TableRow key={row.patient_id}>
                                            <TableCell component="th" scope="row">
                                                {row.name}
                                            </TableCell>
                                            <TableCell>{row.patient_id}</TableCell>
                                            <TableCell>{row.user_ids?.length} caregivers <ManageUsers patient={row} /></TableCell>
                                            <TableCell>{row.sensor_types?.length} measures monitored <ManageSensors patientId={row.patient_id!} patient={row} /></TableCell>
                                            <TableCell> <DownloadData user={props.userDetail} patientId={row.patient_id!} patient={row} /></TableCell>
                                            <TableCell align="right">
                                                <EditPatient user={props.userDetail} patientId={row.patient_id!} patient={row} />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                </TableContainer>
            </Box>
        </Box>
    );
};

export default Patients;
