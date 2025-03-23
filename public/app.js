import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "GOOGLE_API_KEY",
    authDomain: "mycrudapp-fea97.firebaseapp.com",
    projectId: "mycrudapp-fea97",
    storageBucket: "mycrudapp-fea97.appspot.com",
    messagingSenderId: "854452866554",
    appId: "1:854452866554:web:09b59d9e7d915a324ee843"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function uploadCover(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            //Base 64 string for image
            resolve(reader.result);
        };
        reader.readAsDataURL(file);
    });
}

// Function to add song to Firestore
window.addSong = async function() {
    const songName = document.getElementById("songName").value;
    const songArtist = document.getElementById("songArtist").value;
    const songAlbumCover = document.getElementById("songAlbumCover").files[0];
    const description = document.getElementById("description").value;

    if (!songName || !songArtist || !description) {
        await Swal.fire({
            icon: 'error',
            title: 'Missing Information',
            text: 'Please fill in all fields!'
        });
        return;
    }

    if (songAlbumCover) {
        try {
            const albumCoverURL = await uploadCover(songAlbumCover);

            const docRef = await addDoc(collection(db, "songs"), {
                songName: songName,
                songArtist: songArtist,
                songAlbumCover: albumCoverURL,
                description: description
            });
            
            console.log("Document written with ID: ", docRef.id);
            
            document.getElementById("songName").value = '';
            document.getElementById("songArtist").value = '';
            document.getElementById("songAlbumCover").value = '';
            document.getElementById("description").value = '';
            
            await Swal.fire({
                icon: 'success',
                title: 'Song Added!',
                text: 'The song has been successfully added to your collection.'
            });
            
            fetchSongs();
        } catch (e) {
            console.error("Error adding document: ", e);
            await Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to add the song. Please try again.'
            });
        }
    } else {
        await Swal.fire({
            icon: 'error',
            title: 'Missing Album Cover',
            text: 'Please select an album cover image!'
        });
    }
}

// Function to fetch songs from Firestore
async function fetchSongs() {
    const querySnapshot = await getDocs(collection(db, "songs"));
    const songList = document.getElementById("songList");
    songList.innerHTML = "";
    
    querySnapshot.forEach((doc) => {
        const songData = doc.data();
        
        // Create song card for display
        const songCard = document.createElement("div");
        songCard.className = "song-card";
        
        // Create and setup image/fallback
        let imageElement;
        if (songData.songAlbumCover && songData.songAlbumCover.startsWith('data:image')) {
            // Use base64 image to display
            imageElement = new Image();
            imageElement.src = songData.songAlbumCover;
            imageElement.className = "album-cover";
        } else {
            // Fallback element
            imageElement = document.createElement("div");
            imageElement.className = "album-cover";
            imageElement.style.backgroundColor = "#333";
            imageElement.style.display = "flex";
            imageElement.style.alignItems = "center";
            imageElement.style.justifyContent = "center";
            imageElement.style.color = "white";
            imageElement.textContent = "🎵";
        }
        
        // Create song info container
        const songInfo = document.createElement("div");
        songInfo.className = "song-info";
        
        const songTitle = document.createElement("div");
        songTitle.className = "song-name";
        songTitle.textContent = songData.songName;
        
        const songArtist = document.createElement("div");
        songArtist.className = "artist-name";
        songArtist.textContent = `by ${songData.songArtist}`;
        
        const songDescription = document.createElement("div");
        songDescription.className = "description";
        songDescription.textContent = songData.description;
        
        songInfo.appendChild(songTitle);
        songInfo.appendChild(songArtist);
        songInfo.appendChild(songDescription);
        
        // Create buttons container
        const buttons = document.createElement("div");
        buttons.className = "card-buttons";
        
        const updateBtn = document.createElement("button");
        updateBtn.className = "update-btn";
        updateBtn.textContent = "Update";
        updateBtn.onclick = () => updateSong(doc.id);
        
        const deleteBtn = document.createElement("button");
        deleteBtn.className = "delete-btn";
        deleteBtn.textContent = "Delete";
        deleteBtn.onclick = () => deleteSong(doc.id);
        
        // Append everything
        buttons.appendChild(updateBtn);
        buttons.appendChild(deleteBtn);
        songCard.appendChild(imageElement);
        songCard.appendChild(songInfo);
        songCard.appendChild(buttons);
        songList.appendChild(songCard);
    });
}

// Function to update song details base on the user's input
window.updateSong = async function(id) {
    try {
        // Get the current song data first
        const songRef = doc(db, "songs", id);
        const songSnap = await getDoc(songRef);
        const currentData = songSnap.data();

        // Create a form dialog for updating
        const form = document.createElement('div');
        form.innerHTML = `
            <div class="input-container">
                <input type="text" id="updateSongName" value="${currentData.songName}" placeholder="Song Name">
                <input type="text" id="updateSongArtist" value="${currentData.songArtist}" placeholder="Artist">
                <input type="file" id="updateSongAlbumCover" accept="image/*">
                <textarea id="updateDescription" placeholder="Description">${currentData.description}</textarea>
            </div>
        `;

        // Show the form in a dialog
        const result = await Swal.fire({
            title: 'Update Song',
            html: form,
            showCancelButton: true,
            confirmButtonText: 'Update',
            confirmButtonColor: '#fc5974',
            cancelButtonText: 'Cancel',
            preConfirm: async () => {
                const newSongName = document.getElementById('updateSongName').value;
                const newSongArtist = document.getElementById('updateSongArtist').value;
                const newDescription = document.getElementById('updateDescription').value;
                const newAlbumCover = document.getElementById('updateSongAlbumCover').files[0];

                let albumCoverURL = currentData.songAlbumCover;
                if (newAlbumCover) {
                    albumCoverURL = await uploadToImgur(newAlbumCover);
                }

                return {
                    songName: newSongName,
                    songArtist: newSongArtist,
                    songAlbumCover: albumCoverURL,
                    description: newDescription
                };
            }
        });

        if (result.isConfirmed) {
            await updateDoc(songRef, result.value);
            console.log("Song updated!");
            await fetchSongs();
            Swal.fire('Updated!', 'The song has been updated.', 'success');
        }
    } catch (error) {
        console.error("Error updating document: ", error);
        Swal.fire('Error!', 'Failed to update the song.', 'error');
    }
}

// Function to delete song from Firestore
window.deleteSong = async function(id) {
    try {
        // Show confirmation dialog
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#fc5974',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            await deleteDoc(doc(db, "songs", id));
            await Swal.fire(
                'Deleted!',
                'Your song has been deleted.',
                'success'
            );
            fetchSongs();
        }
    } catch (error) {
        console.error("Error deleting document: ", error);
        await Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to delete the song. Please try again.'
        });
    }
}

fetchSongs();