import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../Pages/supabaseClient";
import profile from './images/profile.jpg';
import logo from './images/logo.png';
import { IoCheckmarkSharp, IoCheckmarkDoneSharp, IoClose } from 'react-icons/io5';
import { Bs1CircleFill, Bs2CircleFill, Bs3CircleFill } from 'react-icons/bs';

const UserDashboard = () => {
  const navigate = useNavigate();
  const [availableSlots, setAvailableSlots] = useState([]);
  const [error, setError] = useState(null);
  const [myReservations, setMyReservations] = useState([]);

  // Form states


  const [calendar, setCalendar] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const [userProfile, setUserProfile] = useState({ name: '', profilePicture: '' });

  const [tooltip, setTooltip] = useState({ visible: false, content: '' });
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

  const [todayRoomUsers, setTodayRoomUsers] = useState({
    morningUsers: {},
    afternoonUsers: {}
  });

  useEffect(() => {
    fetchUserData();
    fetchUserProfile();
    fetchTodayRoomUsers();
  }, [currentMonth]);

  const fetchUserData = async () => {
    await Promise.all([fetchReservations()]);
    generateCalendar();
  };

  const fetchReservations = async () => {
    try {
      const { data, error } = await supabase
        .from("reservations")
        .select("*");

      if (error) throw error;
      setMyReservations(data || []);
      generateCalendar();
    } catch (error) {
      setError(error.message);
    }
  };


  const fetchUserProfile = async () => {
    try {
      const userId = localStorage.getItem("userId");
      const { data, error } = await supabase
        .from("users")
        .select("student_id")
        .eq("id", userId)
        .single();

      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleReservation = async (date, startTime) => {
    try {
      const userId = localStorage.getItem("userId");

      // Calculate end time (1 hour after start time)
      const [hours, minutes] = startTime.split(":");
      const startDate = new Date();
      startDate.setHours(parseInt(hours), parseInt(minutes), 0);
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // Add 1 hour
      const endTime = `${endDate
        .getHours()
        .toString()
        .padStart(2, "0")}:${endDate.getMinutes().toString().padStart(2, "0")}`;


      if (error) throw error;

      fetchUserData();
      alert("Reservation created successfully!");
    } catch (error) {
      setError(error.message);
    }
  };

  const handleLogout = () => {
    if (window.confirm("Do you want to Log out?")) {
      localStorage.removeItem("token");
      localStorage.removeItem("userRole");
      localStorage.removeItem("userId");
      navigate("/login");
    }
  };

  const generateCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDayOfMonth = new Date(year, month, 0).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const calendarDays = [];

    // Adjust the start of the week to Monday
    const adjustedFirstDay = (firstDayOfMonth + 6) % 7;

    // Fill in the days before the first day of the month
    for (let i = 0; i < adjustedFirstDay; i++) {
      calendarDays.push({ date: null, status: 'empty' });
    }

    // Fill in the days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const formattedDate = date.toISOString().split('T')[0];

      const userId = localStorage.getItem("userId");
      const reservationsForDay = myReservations.filter(
        (reservation) => reservation.date === formattedDate && reservation.user_id === userId
      );

      const morningReservation = reservationsForDay.find(
        (reservation) => reservation.status === 'morning'
      );
      const afternoonReservation = reservationsForDay.find(
        (reservation) => reservation.status === 'afternoon'
      );
      const cancelledReservation = reservationsForDay.find(
        (reservation) => reservation.status === 'cancelled'
      );
      const eventReservation = reservationsForDay.find(
        (reservation) => reservation.status === 'event'
      );

      // Define morningRooms and afternoonRooms here
      const morningRooms = reservationsForDay
        .filter(reservation => reservation.status === 'morning')
        .map(reservation => reservation.user_id === userId ? `Room ${reservation.room} (You)` : `Room ${reservation.room} (Other users)`)
        .join(', ');

      const afternoonRooms = reservationsForDay
        .filter(reservation => reservation.status === 'afternoon')
        .map(reservation => reservation.user_id === userId ? `Room ${reservation.room} (You)` : `Room ${reservation.room} (Other users)`)
        .join(', ');

      // Update status logic to prioritize reserved over cancelled
      calendarDays.push({
        date: formattedDate,
        status: (morningReservation || afternoonReservation) ? 
          (morningReservation.user_id === userId ? 'orange' : 'gray') : 
          (cancelledReservation ? 'empty' : 'empty'),
      });
    }

    // Ensure the last day of the month is included
    if (calendarDays.length % 7 !== 0) {
      const remainingDays = 7 - (calendarDays.length % 7);
      for (let i = 0; i < remainingDays; i++) {
        calendarDays.push({ date: null, status: 'empty' });
      }
    }

    setCalendar(calendarDays);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'morning':
        return 'orange';
      case 'afternoon':
        return 'yellow';
      case 'red':
        return 'red';
      case 'empty':
        return 'white';
      default:
        return 'white';
    }
  };

  const handlePreviousMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(currentMonth.getMonth() - 1);
    setCurrentMonth(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(currentMonth.getMonth() + 1);
    setCurrentMonth(newDate);
  };

  const handleMouseEnter = (event, content) => {
    setTooltip({ visible: true, content });
    // Set tooltip position based on mouse coordinates
    setTooltipPosition({ top: event.clientY, left: event.clientX });
  };

  const handleMouseLeave = () => {
    setTooltip({ visible: false, content: '' });
  };

  const formatTime = (time) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const suffix = hour >= 12 ? 'pm' : 'am';
    const formattedHour = hour % 12 || 12; // Convert 0 to 12 for 12 AM
    return `${formattedHour}:${minutes} ${suffix}`;
  };

  const handleDayClick = (date) => {
    navigate(`/make-reservation?date=${date}`);
  };

  const fetchTodayRoomUsers = async () => {
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0]; // Format date as YYYY-MM-DD
    console.log("Fetching room users for date:", formattedDate); // Debug log

    try {
        const { data, error } = await supabase
            .from("reservations")
            .select("user_id, room, status") // Include status in the query
            .eq("date", formattedDate);

        if (error) {
            console.error("Error fetching reservations:", error.message); // Debug log
            throw error;
        }

        console.log("Reservations data:", data); // Debug log

        // Map user IDs to usernames
        const userIds = data.map(reservation => reservation.user_id);
        if (userIds.length === 0) {
            console.log("No reservations found for today."); // Debug log
            return { morningUsers: {}, afternoonUsers: {} };
        }

        const { data: usersData, error: usersError } = await supabase
            .from("users")
            .select("id, student_id")
            .in("id", userIds);

        if (usersError) {
            console.error("Error fetching users:", usersError.message); // Debug log
            throw usersError;
        }

        console.log("Users data:", usersData); // Debug log

        // Create mappings for morning and afternoon users
        const morningUsers = {};
        const afternoonUsers = {};
        
        data.forEach(reservation => {
            const user = usersData.find(user => user.id === reservation.user_id);
            if (user) {
                const roomNumber = parseInt(reservation.room); // Ensure room number is an integer
                if (reservation.status === "morning") {
                    if (!morningUsers[roomNumber]) {
                        morningUsers[roomNumber] = [];
                    }
                    morningUsers[roomNumber].push(user.student_id);
                } else if (reservation.status === "afternoon") {
                    if (!afternoonUsers[roomNumber]) {
                        afternoonUsers[roomNumber] = [];
                    }
                    afternoonUsers[roomNumber].push(user.student_id);
                }
            } else {
                console.warn(`User not found for user_id: ${reservation.user_id}`); // Debug log
            }
        });

        console.log("Morning users mapping:", morningUsers); // Debug log
        console.log("Afternoon users mapping:", afternoonUsers); // Debug log
        return { morningUsers, afternoonUsers };
    } catch (error) {
        console.error("Error fetching room users:", error.message);
        return { morningUsers: {}, afternoonUsers: {} };
    }
  };

  useEffect(() => {
    const loadRoomUsers = async () => {
      const roomUsers = await fetchTodayRoomUsers();
      setTodayRoomUsers(roomUsers); // Set the state with fetched room users
    };

    loadRoomUsers();
  }, []); // Empty dependency array to run only on mount

  return (
    <div className="main">
      <div className='logo'> 
        <img src={logo}></img>
      </div>
      <div className="nav">     
              <div>
                <h1>Lab Reservation System</h1>
                <div className="profile-container">
                  <div className="profile-img">
                    <img src={profile} alt="Profile" />
                  </div>
                  <h3>Profile</h3>
                  <h4>{userProfile.student_id}</h4>
                </div>
              </div>
        <div className="home-container">
          {error && <div>{error}</div>}

          <div>
            <Link to="/user">
              <button className="active">Dashboard</button>
            </Link>
          </div>
          <div>
            <Link to="/make-reservation">
              <button>Make a Reservation</button>
            </Link>
          </div>
          <div>
            <Link to="/my-reservations">
              <button>My Reservations</button>
            </Link>
            </div>
            <div>
              <button onClick={handleLogout}>Logout</button>
            </div>
        </div>
      </div>

      {/* Calendar View */}
      <div className="dashboard-container">
        <h2>Calendar</h2>
        <span>{currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
        <div className="month-button">
          <div>
          <button onClick={handlePreviousMonth}>Previous</button>
          <button onClick={handleNextMonth}>Next</button>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px' }}>
          {['M', 'T', 'W', 'Th', 'F', 'S', 'Su'].map((day, index) => (
            <div key={index} style={{ textAlign: 'center', fontWeight: 'bold' }}>
              {day}
            </div>
          ))}
          
          {calendar.map((day, index) => {
            const userId = localStorage.getItem("userId"); // Get the logged-in user's ID
            const reservationsForDay = myReservations.filter(
              (reservation) => reservation.date === day.date
            );

            const morningReservation = reservationsForDay.find(
              (reservation) => reservation.status === 'morning'
            );
            const afternoonReservation = reservationsForDay.find(
              (reservation) => reservation.status === 'afternoon'
            );
            const cancelledReservation = reservationsForDay.find(
              (reservation) => reservation.status === 'cancelled'
            );
            const eventReservation = reservationsForDay.find(
              (reservation) => reservation.status === 'event'
            );

            // Define morningRooms and afternoonRooms here
            const morningRooms = reservationsForDay
              .filter(reservation => reservation.status === 'morning')
              .map(reservation => reservation.user_id === userId ? `Room ${reservation.room} (You)` : `Room ${reservation.room} (Other users)`)
              .join(', ');

            const afternoonRooms = reservationsForDay
              .filter(reservation => reservation.status === 'afternoon')
              .map(reservation => reservation.user_id === userId ? `Room ${reservation.room} (You)` : `Room ${reservation.room} (Other users)`)
              .join(', ');

            // Determine background color based on reservation status
            const backgroundColor = eventReservation ? 'red' : 
                                    (morningReservation && morningReservation.user_id === userId) || 
                                    (afternoonReservation && afternoonReservation.user_id === userId) ? 'orange' : 
                                    (morningReservation || afternoonReservation) ? 'gray' : 
                                    'white';

            // Modify tooltip content based on reservation status
            let tooltipContent = '';
            if (eventReservation) {
              tooltipContent = (
                <div>
                  <div>Event Day: {eventReservation.events}</div>
                </div>
              );
            } else {
              if (morningRooms || afternoonRooms) {
                tooltipContent = (
                  <div>
                    {morningRooms && <div>8:00am - 12:00pm: {morningRooms}</div>}
                    {afternoonRooms && <div>1:00pm - 5:00pm: {afternoonRooms}</div>}
                  </div>
                );
              } else if (cancelledReservation) {
                tooltipContent = (
                  <div>
                    {`${formatTime(cancelledReservation.start_time)} - ${formatTime(cancelledReservation.end_time)} (cancelled, Room ${cancelledReservation.room})`}
                  </div>
                );
              }
            }

            return (
              <div
                key={index}
                onClick={() => day.date && handleDayClick(day.date)}
                style={{
                  backgroundColor: backgroundColor, // Set background color based on reservation status
                  padding: '10px',
                  border: '1px solid #ccc',
                  textAlign: 'center',
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'box-shadow 0.3s, transform 0.3s, color 0.3s',
                  color: day.status === 'cancelled' ? 'red' : 'black',
                }}
                onMouseEnter={(event) => {
                  handleMouseEnter(event, tooltipContent); // Use modified tooltip content
                  event.currentTarget.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.2)';
                  event.currentTarget.style.transform = 'scale(1.05)';
                  event.currentTarget.style.color = 'black';
                }}
                onMouseLeave={(event) => {
                  handleMouseLeave();
                  event.currentTarget.style.boxShadow = 'none';
                  event.currentTarget.style.transform = 'scale(1)';
                  event.currentTarget.style.color = day.status === 'cancelled' ? 'red' : 'black';
                }}
              >
                {day.date ? new Date(day.date).getDate() : ''}
                {(morningRooms || afternoonRooms) && (
                  <div>
                    {morningRooms && <IoCheckmarkSharp style={{ position: 'absolute', right: '0', bottom: '0', margin: '1px', fontSize: '1em', color: 'green' }} />}
                    {afternoonRooms && <IoCheckmarkSharp style={{ position: 'absolute', right: '0', bottom: '0', margin: '1px', fontSize: '1em', color: 'green' }} />}
                    {morningRooms.includes('Room 1') && <Bs1CircleFill style={{ position: 'absolute', left: '2px', top: '2px', color: 'blue' }} />}
                    {morningRooms.includes('Room 2') && <Bs2CircleFill style={{ position: 'absolute', left: '20px', top: '2px', color: 'blue' }} />}
                    {morningRooms.includes('Room 3') && <Bs3CircleFill style={{ position: 'absolute', left: '38px', top: '2px', color: 'blue' }} />}
                    {afternoonRooms.includes('Room 1') && <Bs1CircleFill style={{ position: 'absolute', left: '2px', top: '2px', color: 'blue' }} />}
                    {afternoonRooms.includes('Room 2') && <Bs2CircleFill style={{ position: 'absolute', left: '20px', top: '2px', color: 'blue' }} />}
                    {afternoonRooms.includes('Room 3') && <Bs3CircleFill style={{ position: 'absolute', left: '38px', top: '2px', color: 'blue' }} />}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="bottom-container">
        <div>
            <p>Rooms</p>
            <p>Room 1 = Computer lab 1 - WAC 212</p>
            <p>Room 2 = Computer lab 2 - WAC 213</p>
            <p>Room 3 = Computer lab 3 - NAC 303</p>
          </div>
        <div>
          <p>Color code Reservation:</p>
          <p style={{ color: 'orange' }}>Orange - Your Reservation</p>
          <p style={{ color: 'gray' }}>Gray - Other's Reservation</p>
          <p style={{ color: 'red' }}>Red - Event</p>
          <p style={{ color: 'white' }}>White - Available</p>
        </div>
        </div>
        <div className="todaysRoom">
        <h1>Today's Room User</h1>
        <div className="currentRoom-container">
          <div className="currentRoom">
            <h3>Morning {"(8:00am to 12:00pm)"}</h3>
            <div>Room 1: {todayRoomUsers.morningUsers[1]?.join(', ') || 'No users'}</div>
            <div>Room 2: {todayRoomUsers.morningUsers[2]?.join(', ') || 'No users'}</div>
            <div>Room 3: {todayRoomUsers.morningUsers[3]?.join(', ') || 'No users'}</div>
          </div>
          <div className="currentRoom">
            <h3>Afternoon {"(1:00pm to 5:00pm)"}</h3>
            <div>Room 1: {todayRoomUsers.afternoonUsers[1]?.join(', ') || 'No users'}</div>
            <div>Room 2: {todayRoomUsers.afternoonUsers[2]?.join(', ') || 'No users'}</div>
            <div>Room 3: {todayRoomUsers.afternoonUsers[3]?.join(', ') || 'No users'}</div>
          </div>
        </div>
      </div>
      </div>
      

      {tooltip.visible && (
        <div className="tooltip" style={{ position: 'absolute', top: tooltipPosition.top, left: tooltipPosition.left, backgroundColor: 'rgba(0, 0, 0, 0.7)', color: 'white', padding: '5px', borderRadius: '5px' }}>
          {tooltip.content}
        </div>
      )}
    </div>
  );
};

export default UserDashboard;