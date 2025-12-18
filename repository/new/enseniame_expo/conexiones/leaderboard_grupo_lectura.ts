
export const getBooksyUsersList = async () => {
  try {
    const response = await fetch('https://two025-chocapinto-back.onrender.com/api/booksy/users', {
      method: 'GET',
      headers: {
        'x-api-key': 'booksy-external-api-2025',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) throw new Error(`Error al obtener usuarios: ${response.status}`);

    const apiData = await response.json();
    return apiData?.data?.users ?? [];

  } catch (error: any) {
    console.error('Error en getBooksyUsersList:', error.message);
    return [];
  }
};

export const getBooksyUserClubInfo = async (email: string) => {
  try {
    // 1. Obtener lista básica
    const users = await getBooksyUsersList();
    const user = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());

    if (!user) return null;

    // 2. Obtener datos completos (incluye cursos)
    const response = await fetch(
      `https://two025-chocapinto-back.onrender.com/api/booksy/users/${user.userId}`,
      {
        method: 'GET',
        headers: {
          'x-api-key': 'booksy-external-api-2025',
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) throw new Error(`Error al obtener usuario: ${response.status}`);

    const apiData = await response.json();
    return apiData.data;

  } catch (error: any) {
    console.error('Error en getBooksyUserClubInfo:', error.message);
    return null;
  }
};

export const getUserClub = async (email: string): Promise<number | null> => {
    const user = await getBooksyUserClubInfo(email);
    if (!user || !user.courses || user.courses.length === 0) return null;

    // El JSON repite el mismo clubId: devolvemos solo uno (el primero)
    const clubId: number = user.courses[0].clubId;
    console.log('Club ID obtenido para el usuario:', clubId);
    return clubId;
};


export const getClubUsersProgress = async (clubId: number) => {
  try {
    const users = await getBooksyUsersList();

    const detailedUsers = [];

    for (const user of users) {
      // obtener datos completos
      const userFull = await getBooksyUserClubInfo(user.email);
      if (!userFull) continue;

      const coursesInClub = userFull.courses.filter(
        (course: any) => course.clubId === clubId
      );

      if (coursesInClub.length === 0) continue;

      detailedUsers.push({
        userId: userFull.userId,
        username: userFull.username,
        email: userFull.email,
        clubId,
        clubName: coursesInClub[0]?.clubName || '',
        courses: coursesInClub.map((course: any) => ({
          courseId: course.courseId,
          courseTitle: course.courseTitle,
          progressPercentage: course.progressPercentage,
          status: course.status,
        })),
      });
    }

    return detailedUsers;

  } catch (error: any) {
    console.error('Error en getClubUsersProgress:', error.message);
    return [];
  }
};
