import { useState, useEffect } from "react";
import {
  Container,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  Box,
  Snackbar,
  Alert,
} from "@mui/material";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useParams,
  useNavigate,
  Link,
} from "react-router-dom";

const generateShortCode = () => Math.random().toString(36).substring(2, 8);
const defaultValidityMinutes = 30;

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Shortener />} />
        <Route path="/stats" element={<Statistics />} />
        <Route path="/:code" element={<RedirectPage />} />
      </Routes>
    </Router>
  );
}

function Shortener() {
  const [rows, setRows] = useState([{ url: "", minutes: "", custom: "" }]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const handleChange = (i, field, value) => {
    const updated = [...rows];
    updated[i][field] = value;
    setRows(updated);
  };

  const handleAddRow = () => {
    if (rows.length < 5)
      setRows([...rows, { url: "", minutes: "", custom: "" }]);
  };

  const handleRemoveRow = (index) => {
    if (rows.length > 1) {
      const updated = [...rows];
      updated.splice(index, 1);
      setRows(updated);
    }
  };

  const handleShorten = () => {
    let errors = [];
    let newLinks = [];

    rows.forEach((r, i) => {
      if (!r.url.trim()) return;

      if (!isValidUrl(r.url.trim()))
        errors.push("Row " + (i + 1) + ": Invalid URL");

      const minutes =
        r.minutes === "" ? defaultValidityMinutes : Number(r.minutes);
      if (!Number.isInteger(minutes) || minutes < 0)
        errors.push(
          "Row " +
            (i + 1) +
            ": Validity must be a non-negative integer (minutes)"
        );

      let code = r.custom || generateShortCode();
      let existing = JSON.parse(localStorage.getItem("links") || "[]");
      if (existing.find((e) => e.code === code))
        errors.push("Row " + (i + 1) + ": Shortcode already exists");

      const expiresAt = minutes === 0 ? null : Date.now() + minutes * 60000;
      newLinks.push({
        url: r.url.trim(),
        code,
        createdAt: Date.now(),
        expiresAt,
        clicks: [],
      });
    });

    if (errors.length) {
      setSnackbar({
        open: true,
        message: errors.join(" | "),
        severity: "error",
      });
      return;
    }

    let existing = JSON.parse(localStorage.getItem("links") || "[]");
    existing = [...existing, ...newLinks];
    localStorage.setItem("links", JSON.stringify(existing));

    setSnackbar({
      open: true,
      message: "URLs shortened successfully!",
      severity: "success",
    });
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        URL Shortener
      </Typography>
      {rows.map((row, i) => (
        <Grid container spacing={2} key={i} sx={{ mb: 2 }}>
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              label="Original URL"
              value={row.url}
              onChange={(e) => handleChange(i, "url", e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Validity (minutes)"
              value={row.minutes}
              onChange={(e) => handleChange(i, "minutes", e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Custom Shortcode"
              value={row.custom}
              onChange={(e) => handleChange(i, "custom", e.target.value)}
            />
          </Grid>
          {rows.length > 1 && (
            <Grid item xs={12} md={1}>
              <Button
                variant="text"
                color="error"
                onClick={() => handleRemoveRow(i)}
              >
                Delete
              </Button>
            </Grid>
          )}
        </Grid>
      ))}
      <Button variant="outlined" onClick={handleAddRow} sx={{ mr: 2 }}>
        Add Row
      </Button>
      <Button variant="contained" onClick={handleShorten}>
        Shorten
      </Button>
      <Box sx={{ mt: 3 }}>
        <Button component={Link} to="/stats" variant="outlined">
          View Statistics
        </Button>
      </Box>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Container>
  );
}

function Statistics() {
  const [links, setLinks] = useState([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    let stored = JSON.parse(localStorage.getItem("links") || "[]");
    setLinks(stored);
  }, []);

  const handleCopy = (url) => {
    navigator.clipboard.writeText(url);
    setSnackbar({ open: true, message: "Copied to clipboard!", severity: "success" });
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        URL Statistics
      </Typography>
      <Grid container spacing={2}>
        {links.map((link, i) => (
          <Grid item xs={12} md={6} key={i}>
            <Card>
              <CardContent>
                <Typography variant="body1">
                  Shortened URL:{" "}
                  <Link to={"/" + link.code}>http://short.ly/{link.code}</Link>
                  <Button
                    size="small"
                    variant="text"
                    onClick={() => handleCopy(`http://short.ly/${link.code}`)}
                    sx={{ ml: 1 }}
                  >
                    Copy
                  </Button>
                </Typography>
                <Typography variant="body2">Original: {link.url}</Typography>
                <Typography variant="body2">
                  Created: {new Date(link.createdAt).toLocaleString()}
                </Typography>
                <Typography variant="body2">
                  Expiry:{" "}
                  {link.expiresAt
                    ? new Date(link.expiresAt).toLocaleString()
                    : "Never"}
                </Typography>
                <Typography variant="body2">
                  Clicks: {link.clicks.length}
                </Typography>
                {link.clicks.map((c, idx) => (
                  <Typography key={idx} variant="caption" display="block">
                    {new Date(c.time).toLocaleString()} - {c.source}
                  </Typography>
                ))}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Container>
  );
}

function RedirectPage() {
  const { code } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    let stored = JSON.parse(localStorage.getItem("links") || "[]");
    let found = stored.find((l) => l.code === code);

    if (!found) {
      alert("Short URL not found");
      navigate("/");
      return;
    }

    if (found.expiresAt && Date.now() > found.expiresAt) {
      alert("This URL has expired");
      navigate("/");
      return;
    }

    found.clicks.push({ time: Date.now(), source: document.referrer || "direct" });
    localStorage.setItem("links", JSON.stringify(stored));

    window.location.href = found.url;
  }, [code, navigate]);

  return null;
}

function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
}

export default App;